/* eslint-env mocha */
'use strict'

const { expect } = require('./harness')
const relatedProjects = require('../src/helpers/related_projects.js')

describe('related_projects', () => {
  const projects = [
    project('framework', {
      categories: ['core'],
    }),
    project('security', {
      categories: ['security'],
      children: [
        project('session', {
          categories: ['security'],
        }),
      ],
    }),
  ]

  it('projects categories and projectIds empty returns all results', () => {
    const projectIds = relatedProjectIds([], [], projects)
    expect(projectIds).is.eql(['framework', 'security', 'session'])
  })

  it('projectsIds empty and categories specified returns only categories', () => {
    const projectIds = relatedProjectIds(['security'], [''], projects)
    expect(projectIds).is.eql(['security', 'session'])
  })

  it('projectsIds specified and categories empty returns only ids', () => {
    const projectIds = relatedProjectIds([], ['framework'], projects)
    expect(projectIds).is.eql(['framework'])
  })

  it('project id is substring', () => {
    const projects = [
      project('cloud', {
        categories: ['cloud'],
        children: [
          project('cloud-stream', {
            categories: ['cloud'],
          }),
          project('cloud-gateway', {
            categories: ['cloud'],
          }),
        ],
      }),
    ]
    const projectIds = relatedProjectIds([], ['cloud', 'cloud-stream'], projects)
    expect(projectIds).is.eql(['cloud', 'cloud-stream'])
  })

  it('children not included if parent is not', () => {
    const projects = [
      project('cloud', {
        categories: ['cloud'],
        children: [
          project('cloud-stream', {
            categories: ['cloud'],
          }),
          project('cloud-gateway', {
            categories: ['cloud'],
          }),
        ],
      }),
    ]
    const projectIds = relatedProjectIds([], ['cloud-stream'], projects)
    expect(projectIds).is.eql([])
  })

  it('categories defined but project.categories is null', () => {
    const projects = [project('cloud', { categories: ['cloud'] }), project('spring-integration')]
    const projectIds = relatedProjectIds(['cloud'], [''], projects)
    expect(projectIds).is.eql(['cloud'])
  })

  it('categories is null and projectIds is null returns all results', () => {
    const projects = [project('cloud')]
    const projectIds = relatedProjectIds(undefined, undefined, projects)
    expect(projectIds).is.eql(['cloud'])
  })

  it('categories is null and projectIds is defined filters by projectIds', () => {
    const projects = [project('security'), project('cloud')]
    const projectIds = relatedProjectIds(undefined, ['cloud'], projects)
    expect(projectIds).is.eql(['cloud'])
  })

  it('categories is defined and projectIds is undefined filters by categories', () => {
    const projects = [project('security', { categories: ['security'] }), project('cloud', { categories: ['cloud'] })]
    const projectIds = relatedProjectIds(undefined, ['cloud'], projects)
    expect(projectIds).is.eql(['cloud'])
  })
})

function project (id, attrs) {
  return { href: `https://docs.spring.io/spring-${id}/reference/`, ...attrs, id: id, text: `Spring ${id}` }
}

function relatedProjectIds (categories, projectIds, projects) {
  return collectIdsForProjects(relatedProjects(categories, projectIds, projects))
}

function collectIdsForProjects (projects, results = []) {
  for (const p of projects) {
    collectIds(p, results)
  }
  return results
}

function collectIds (p, results) {
  results.push(p.id)
  if (p.children) {
    collectIdsForProjects(p.children, results)
  }
}
