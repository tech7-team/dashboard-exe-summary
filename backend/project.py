from fastapi import HTTPException
from auth import header, url
import httpx
import requests
from work_package import get_all_wp
from version import get_all_versions
from collections import Counter

async def count_all():
    all_projects = await get_all_projects()
    all_wp = await get_all_wp()
    all_versions = await get_all_versions()
    total_project = 0
    total_wp = 0
    total_version = 0
    for project in all_projects:
        total_project += 1
    for wp in all_wp:
        total_wp += 1
    for version in all_versions:
        total_version += 1
    return {"total_project": total_project, 
            "total_wp": total_wp, 
            "total_version": total_version}

async def get_all_projects():
    try: 
        async with httpx.AsyncClient() as client:
            projects = requests.get(f"{url}/projects",headers=header)
            projects.raise_for_status()
            all_projects = []
            data = projects.json()
            if "_embedded" in data and "elements" in data["_embedded"]:
                elements = data["_embedded"]["elements"]
                for element in elements:
                    project_id = element["id"]
                    project_name = element["name"]
                    # seluruh project harus di set status
                    project_status = element["_links"]["status"]["title"] if "title" in element["_links"]["status"] else "No Status" 
                    # seluruh project harus di set priority
                    project_priority = element["_links"]["customField5"]["title"] if "customField5" in element["_links"] \
                        and "title" in element["_links"]["customField5"] else "No Priority" 
                    project_parent = element["_links"].get("parent", {}).get("title")

                    if project_parent is None:
                        project_parent = None

                    if len(project_name) == 7:
                        all_projects.append({"project_id": project_id, 
                                            "project_name": project_name,
                                            "project_parent": project_parent, 
                                            "project_status": project_status, 
                                            "project_priority": project_priority})
                if all_projects:
                    return all_projects
                else:
                    raise HTTPException(status_code=404, detail="No projects found.")   
            else:
                raise HTTPException(status_code=404, detail="Invalid response format.")

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail="Failed to connect to the API.")
    except ValueError as e:
        raise HTTPException(status_code=500, detail="Invalid JSON response from the API.")
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    
    
async def project_count_by_status():
    all_projects = await get_all_projects()
    status_list = [project.get("project_status") for project in all_projects if project.get("project_status")]
    status_counts = dict(Counter(status_list))
    return status_counts

async def project_count_by_priority():
    all_projects = await get_all_projects()
    priority_list = [project.get("project_priority") for project in all_projects if project.get("project_priority")]
    priority_counts = dict(Counter(priority_list))
    return priority_counts


async def project_list():
    all_projects = await get_all_projects()
    project_list = []
    for project in all_projects:
        project_name = project.get("project_name")
        project_list.append(project_name)

    return project_list

async def project_list_by_status():
    all_projects = await get_all_projects()
    project_list = {}
    for project in all_projects:
        project_name = project.get("project_name")
        status = project.get("project_status")

        if project_name is not None and status is not None:
            if status not in project_list:
                project_list[status] = []

            project_list[status].append(project_name)

    return project_list
    
async def project_list_by_priority():
    all_projects = await get_all_projects()
    project_list = {}
    for project in all_projects:
        project_name = project.get("project_name")
        priority = project.get("project_priority")

        if project_name is not None and priority is not None:
            if priority not in project_list:
                project_list[priority] = []

            project_list[priority].append(project_name)

    return project_list

async def get_progress_project():
    all_wp = await get_all_wp()
    progress_counts = {}
    wp_types = []
    for item in all_wp:
        value = item.get("project_name")
        status = item.get("status")
        story_points = item.get("story_points")
        type = item.get("wp_type")
        percentage_done = item.get("percentage_done")

        if type not in wp_types:
            wp_types.append(type)

        if value is not None:
            if value not in progress_counts:
                progress_counts[value] = {
                    "wp_total": 0,
                    "wp_done": 0,
                    "progress": 0,
                    "story_points": 0
                }

            progress_counts[value]["wp_total"] += 1

            if story_points is not None:
                progress_counts[value]["story_points"] += story_points

            if status == "Done":
                progress_counts[value]["wp_done"] += 1

            if type == "Initiative":
                progress_counts[value]["progress"] = percentage_done

    result = []
    for progress_name, counts in progress_counts.items():
        result.append({
            "project_name": progress_name,
            "wp_types": wp_types,
            "progress": {
                "wp_total": counts["wp_total"],
                "wp_done": counts["wp_done"],
                "progress_by_initiative": counts["progress"],
                "progress_by_wp": round((counts["wp_done"]/counts["wp_total"])*100),
                "story_points": counts["story_points"]
            }
        })
    return result

async def get_progress_assignee_project(wp_types=None):
    assignee_progress = {}
    all_wp = await get_all_wp()
    for item in all_wp:
        project_name = item.get("project_name")
        assignee = item.get("assignee")
        story_points = item.get("story_points")
        wp_type = item.get("wp_type")

        if project_name is not None and assignee is not None:
            if wp_types is None or wp_type in wp_types:
                if project_name not in assignee_progress:
                    assignee_progress[project_name] = []

                assignee_data = None
                for data in assignee_progress[project_name]:
                    if data["user_name"] == assignee:
                        assignee_data = data
                        break

                if assignee_data is None:
                    assignee_data = {
                        "user_name": assignee,
                        "wp_total": 0,
                        "wp_done": 0,
                        "story_points": 0
                    }
                    assignee_progress[project_name].append(assignee_data)

                assignee_data["wp_total"] += 1

                if item.get("status") == "Done":
                    assignee_data["wp_done"] += 1

                if story_points is not None:
                    assignee_data["story_points"] += story_points

    result = []
    for project_name, progress in assignee_progress.items():
        for data in progress:
            data["progress"] = round((data["wp_done"] / data["wp_total"]) * 100)
        result.append({
            "project_name": project_name,
            "progress": progress
        })
    return result
