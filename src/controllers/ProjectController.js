class ProjectController {
  static async getAllProjects(req, res) {
    // Logic to get all projects
    res.json({ message: 'Get all projects' });
  }

  static async createProject(req, res) {
    // Logic to create a project
    res.status(201).json({ message: 'Project created' });
  }

  static async updateProject(req, res) {
    // Logic to update a project
    res.json({ message: 'Project updated' });
  }

  static async deleteProject(req, res) {
    // Logic to delete a project
    res.json({ message: 'Project deleted' });
  }
}

export default ProjectController; 