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
            est_hours = max(1, int(float(task.get("estHours") or 1)))
            category = task.get("category", "Assignment")
            due_date = task.get("dueDate") or task.get("deadline") or "9999-12-31"
            study_items.append({
                "id": task.get("id"),
                "type": "task",
                "title": f"📝 {category}: {task.get('title', 'Assignment')}" if category == "Assignment" else f"📌 {category}: {task.get('title', 'Task')}",
                "rawTitle": task.get("title", "Untitled Task"),
                "subject": task.get("subject", "General"),
                "priority": task.get("priority", "Medium"),
                "category": category,
                "weight": weight + 2, # Tasks get precedence
                "deadline": due_date,
                "needed_slots": est_hours,
                "remaining_slots": est_hours
            })

    for topic in topics:
        if not topic.get("completed"):
            weight = PRIORITY_WEIGHT.get(topic.get("priority", "Medium"), 2)
            est_hours = max(1, int(float(topic.get("estHours") or 2)))
            study_items.append({
                "id": topic.get("id"),
                "type": "topic",
                "title": f"Topic: {topic.get('name', 'Study Chapter')}",
                "rawTitle": topic.get("name", "Study Chapter"),
                "subject": topic.get("subject", "General"),
                "priority": topic.get("priority", "Medium"),
                "category": "Study Session",
                "weight": weight,
                "deadline": "9999-12-31",
                "needed_slots": est_hours,
                "remaining_slots": est_hours
            })

    # Group available slots by date for balanced day scheduling
    slots_by_date = {}
    for slot in available_slots:
        d = slot["date"]
        if d not in slots_by_date:
            slots_by_date[d] = []
        slots_by_date[d].append(slot)

    timetable = []

    for d_str in sorted(slots_by_date.keys()):
        day_slots = slots_by_date[d_str]
        last_item_id = None
        day_usage = {}

        for slot in day_slots:
            candidates = []
            for item in study_items:
                if item["remaining_slots"] <= 0:
                    continue
                # Score candidate
                score = item["weight"] * 20
                if item["type"] == "task":
                    score += 25
                    if item["deadline"] <= d_str:
                        score += 100 # Due today or overdue!
                if last_item_id == item["id"]:
                    score -= 30 # Rotate items
                if day_usage.get(item["id"], 0) >= 2:
                    score -= 50

                candidates.append((score, item))

            if not candidates:
                timetable.append({
                    "id": f"slot-{slot['date']}-{slot['hour']}-general",
                    "taskId": None,
                    "topicId": None,
                    "type": "study",
                    "subject": "General",
                    "title": "Deep Focus & Self Study",
                    "day": slot["day"],
                    "date": slot["date"],
                    "hour": slot["hour"],
                    "time": slot["time"],
                    "completed": False
                })
                last_item_id = None
                continue

            candidates.sort(key=lambda x: -x[0])
            chosen = candidates[0][1]

            timetable.append({
                "id": f"slot-{slot['date']}-{slot['hour']}-{chosen['id']}",
                "taskId": chosen["id"] if chosen["type"] == "task" else None,
                "topicId": chosen["id"] if chosen["type"] == "topic" else None,
                "type": chosen["type"],
                "subject": chosen["subject"],
                "title": chosen["title"],
                "day": slot["day"],
                "date": slot["date"],
                "hour": slot["hour"],
                "time": slot["time"],
                "completed": False
            })

            chosen["remaining_slots"] -= 1
            day_usage[chosen["id"]] = day_usage.get(chosen["id"], 0) + 1
            last_item_id = chosen["id"]

    return timetable
