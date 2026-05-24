import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AssignmentController } from '../controllers/assignmentController';

const router = Router();

// Ensure the local uploads directory exists
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit matching UI specs
});

// Configure API endpoints
router.get('/', AssignmentController.listAssignments);
router.get('/:id/output', AssignmentController.getAssignmentOutput);
router.put('/:id/output', AssignmentController.updateQuestionPaper);
router.post('/:id/regenerate-question', AssignmentController.regenerateQuestion);
router.post('/', upload.array('files', 10), AssignmentController.createAssignment); // Up to 10 files
router.delete('/:id', AssignmentController.deleteAssignment);

export default router;
