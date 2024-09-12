import express from 'express';
import { generateThumbnail } from '../controllers/thumbnailController';
import { getAiImage, saveAiImage, validateTopic } from '../../middlewares';


const router = express.Router();

router.post('/generate', validateTopic, getAiImage, saveAiImage, generateThumbnail);

export default router;
