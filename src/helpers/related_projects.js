'use strict'

module.exports = (categories, projectIds, projects) => relatedProjects(categories, projectIds, projects)

function relatedProjects (categories, projectIds, projects) {
  categories = categories || []
  projectIds = projectIds || []
  if (categories.length === 0 && projectIds.length === 0) {
    return projects
  }
  const result = projects.filter(
    (project) => filterProjectByCategories(project, categories) || filterProjectByProjectIds(project, projectIds)
  )
  for (const project of result) {
    if (project.children) {
      project.children = relatedProjects(categories, projectIds, project.children)
    }
  }
  return result
}

function filterProjectByCategories (project, categories) {
  return project.categories && categories.some((category) => project.categories.includes(category))
}

function filterProjectByProjectIds (project, projectIds) {
  return projectIds.some((projectId) => project.id === projectId)
}
