import datetime
from typing import List, Dict, Any

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
PRIORITY_WEIGHT = {"High": 3, "Medium": 2, "Low": 1}

def parse_iso_date(date_str: str) -> datetime.date:
    try:
        return datetime.datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except Exception:
        return datetime.date.today()

def generate_smart_timetable(
    tasks: List[Dict[str, Any]],
    topics: List[Dict[str, Any]],
    availability: Dict[str, List[int]],
    week_start_str: str,
    college_schedule: List[Dict[str, Any]] = None,
    exam_schedule: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    if college_schedule is None:
        college_schedule = []
    if exam_schedule is None:
        exam_schedule = []

    week_start = parse_iso_date(week_start_str)

    # 1. Build available slots
    available_slots = []
    for d in range(7):
        current_date = week_start + datetime.timedelta(days=d)
        day_key = DAYS[d]
        date_iso = current_date.isoformat()
        hours = availability.get(day_key, [])

        for h in hours:
            # Check collision with college schedule
            collision_college = any(
                cs.get("day") == day_key and 
                int(cs.get("startTime", "00:00").split(":")[0]) <= h < int(cs.get("endTime", "23:59").split(":")[0])
                for cs in college_schedule
            )
            # Check collision with exams
            collision_exam = any(
                es.get("date") == date_iso and 
                int(es.get("startTime", "00:00").split(":")[0]) <= h < int(es.get("startTime", "00:00").split(":")[0]) + max(1, (int(es.get("durationMins", 60)) // 60))
                for es in exam_schedule
            )

            if not collision_college and not collision_exam:
                available_slots.append({
                    "day": day_key,
                    "date": date_iso,
                    "hour": h,
                    "time": f"{str(h).zfill(2)}:00"
                })

    # 2. Collect pending study tasks and incomplete topics
    study_items = []

    for task in tasks:
        if not task.get("completed"):
            weight = PRIORITY_WEIGHT.get(task.get("priority", "Medium"), 2)
            est_hours = max(1, int(task.get("estHours") or 1))
            study_items.append({
                "id": task.get("id"),
                "type": "task",
                "title": task.get("title", "Untitled Task"),
                "subject": task.get("subject", "General"),
                "priority": task.get("priority", "Medium"),
                "weight": weight + 2, # Tasks get slight boost
                "deadline": task.get("deadline", "9999-12-31"),
                "needed_slots": est_hours
            })

    for topic in topics:
        if not topic.get("completed"):
            weight = PRIORITY_WEIGHT.get(topic.get("priority", "Medium"), 2)
            est_hours = max(1, int(topic.get("estHours") or 1))
            study_items.append({
                "id": topic.get("id"),
                "type": "topic",
                "title": topic.get("name", "Study Chapter"),
                "subject": topic.get("subject", "General"),
                "priority": topic.get("priority", "Medium"),
                "weight": weight,
                "deadline": "9999-12-31",
                "needed_slots": est_hours
            })

    # Sort items by priority weight descending and deadline ascending
    study_items.sort(key=lambda x: (-x["weight"], x["deadline"]))

    timetable = []
    slot_idx = 0
    total_slots = len(available_slots)

    for item in study_items:
        slots_allocated = 0
        while slots_allocated < item["needed_slots"] and slot_idx < total_slots:
            slot = available_slots[slot_idx]
            timetable.append({
                "id": f"slot-{slot['date']}-{slot['hour']}-{item['id']}",
                "taskId": item["id"] if item["type"] == "task" else None,
                "topicId": item["id"] if item["type"] == "topic" else None,
                "type": item["type"],
                "subject": item["subject"],
                "title": item["title"],
                "day": slot["day"],
                "date": slot["date"],
                "hour": slot["hour"],
                "time": slot["time"],
                "completed": False
            })
            slots_allocated += 1
            slot_idx += 1

    return timetable
