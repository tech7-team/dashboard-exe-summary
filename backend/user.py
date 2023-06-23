from work_package import get_all_wp
import requests
from auth import header, url

memberships = requests.get(f"{url}/memberships",headers=header)

def get_all_memberships():
    all_memberships = []
    data = memberships.json()
    if "_embedded" in data and "elements" in data["_embedded"]:
        elements = data["_embedded"]["elements"]
        for element in elements:
            memberships_id = element["id"]
            member_name = element["_links"]["self"]["title"]
            project_name = element["_links"]["project"]["title"]
            role = element["_links"]["roles"][0]["title"]
            all_memberships.append({"memberships_id": memberships_id, 
                                     "member_name": member_name, 
                                     "project_name": project_name,
                                     "role": role}) 
    if all_memberships:
        return all_memberships
    else:
        return {"message": "No memberships found."}
    
def get_project_members():
    memberships = get_all_memberships()
    project_details = {}

    for member in memberships:
        project_name = member.get("project_name") 
        if project_name not in project_details:
            project_details[project_name] = {"project_name": project_name, "members": []}
        
        project_details[project_name]["members"].append({
            "member_id": member["memberships_id"],
            "member_name": member["member_name"],
            "role": member["role"]
        })

    list_project_details = list(project_details.values())
    return list_project_details
    
def get_progress_assignee():
    assignee_progress = {}
    all_wp = get_all_wp()
    for item in all_wp:
        month = item.get("month")
        assignee = item.get("assignee")

        if month is not None and assignee is not None:
            if month not in assignee_progress:
                assignee_progress[month] = []

            assignee_data = None
            for data in assignee_progress[month]:
                if data["user_name"] == assignee:
                    assignee_data = data
                    break

            if assignee_data is None:
                assignee_data = {
                    "user_name": assignee,
                    "wp_total": 0,
                    "wp_done": 0
                }
                assignee_progress[month].append(assignee_data)

            assignee_data["wp_total"] += 1

            if item.get("status") == "Done":
                assignee_data["wp_done"] += 1

    result = []
    for month, progress in assignee_progress.items():
        for data in progress:
            data["progress"] = (data["wp_done"] / data["wp_total"]) * 100
        result.append({
            "month": month,
            "progress": progress
        })
    return result

def get_assignee_details():
    assignee_details = {}
    all_wp = get_all_wp()
    for item in all_wp:
        user_name = item.get("assignee")
        project_name = item.get("project_name")
        story_points = item.get("story_points")

        if user_name is not None and project_name is not None:
            if user_name not in assignee_details:
                assignee_details[user_name] = []

            projects_data = None
            for data in assignee_details[user_name]:
                if data["project_name"] == project_name:
                    projects_data = data
                    break

            if projects_data is None:
                projects_data = {
                    "project_name": project_name,
                    "wp_assigned": 0,
                    "story_points": 0
                }
                assignee_details[user_name].append(projects_data)

            projects_data["wp_assigned"] += 1

            if story_points is not None:
                projects_data["story_points"] += story_points

    result = []
    for user_name, projects in assignee_details.items():
        result.append({
            "user_name": user_name,
            "projects": projects
        })
    return result

def get_assignee_wp_details():
    wp_details = {}
    all_wp = get_all_wp()
    for item in all_wp:
        user_name = item.get("assignee")
        project_name = item.get("project_name")
        wp_name = item.get("wp_name")
        progress = item.get("percentage_done")
        story_points = item.get("story_points")

        if user_name is not None and project_name is not None:  
            if user_name not in wp_details:
                wp_details[user_name] = []

            project_data = None
            for data in wp_details[user_name]:
                if data["project_name"] == project_name:
                    project_data = data
                    break

            if project_data is None:
                project_data = {
                    "project_name": project_name,
                    "wp_assigned": []
                }
                wp_details[user_name].append(project_data)
            
            wp_assigned_data = {
                "wp_name": wp_name,
                "progress": progress,
                "story_points": story_points
            }
            project_data["wp_assigned"].append(wp_assigned_data)

    result = []
    for user_name, projects in wp_details.items():
        result.append({
            "user_name": user_name,
            "projects": projects
        })
    return result