import { Router } from 'express';
import { ToolkitController } from '../controllers/toolkitController';

const router = Router();

// Endpoint for generating lesson plans, rubrics, and activity planners
router.post('/generate', ToolkitController.generateResource);
router.get('/', ToolkitController.listResources);

export default router;
