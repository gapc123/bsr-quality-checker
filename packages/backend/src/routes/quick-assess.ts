import { Router, Request, Response } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: '/tmp' });

// POST /api/quick-assess - DEMO VERSION - Returns mock results
router.post('/', upload.array('documents', 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(`DEMO: Processing ${files.length} files`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock assessment results
    const mockResults = {
      criteria: [
        { id: 1, name: 'Fire Strategy Present', status: 'pass', evidence: 'Found in uploaded document' },
        { id: 2, name: 'Building Height Compliant', status: 'pass', evidence: 'Meets BSR requirements' },
        { id: 3, name: 'Evacuation Plan', status: 'fail', evidence: 'Not found in submission' },
        { id: 4, name: 'Fire Door Specifications', status: 'pass', evidence: 'FD30 doors specified' },
        { id: 5, name: 'Compartmentation Details', status: 'pass', evidence: 'Detailed in drawings' },
      ]
    };

    res.json({
      success: true,
      documentsProcessed: files.length,
      results: mockResults,
      passCount: mockResults.criteria.filter(c => c.status === 'pass').length,
      failCount: mockResults.criteria.filter(c => c.status === 'fail').length,
      totalCount: mockResults.criteria.length,
    });

  } catch (error) {
    console.error('Quick assessment error:', error);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

export default router;
