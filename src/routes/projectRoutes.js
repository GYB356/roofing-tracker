import { Router } from 'express';
import ProjectController from '../controllers/ProjectController';
import authMiddleware from '../middleware/authMiddleware';
import rbacMiddleware from '../middleware/rbacMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', rbacMiddleware(['ADMIN', 'STAFF']), ProjectController.getAllProjects);
router.post('/', rbacMiddleware(['ADMIN']), ProjectController.createProject);
router.put('/:id', rbacMiddleware(['ADMIN']), ProjectController.updateProject);
router.delete('/:id', rbacMiddleware(['ADMIN']), ProjectController.deleteProject);

export default router;
