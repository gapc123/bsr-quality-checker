-- Create ServicePackageTemplate table
CREATE TABLE "ServicePackageTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageType" TEXT NOT NULL UNIQUE,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "estimatedDuration" INTEGER,
    "slaTargetDays" INTEGER,
    "taskTemplates" TEXT NOT NULL,
    "milestoneTemplates" TEXT,
    "defaultTags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create index
CREATE INDEX "ServicePackageTemplate_packageType_idx" ON "ServicePackageTemplate"("packageType");

-- Seed default templates
INSERT INTO "ServicePackageTemplate" (
    "id",
    "packageType",
    "displayName",
    "description",
    "estimatedDuration",
    "slaTargetDays",
    "taskTemplates",
    "milestoneTemplates",
    "defaultTags",
    "createdAt",
    "updatedAt"
) VALUES
-- Gap Assessment Template
(
    'gap-assessment-template',
    'gap_assessment',
    'Gap Assessment',
    'Identify compliance gaps and required actions',
    10,
    10,
    '[
        {"title":"Initial document review","description":"Review all submitted documents for completeness and format","category":"Document Review","priority":"high","estimatedHours":4,"dayOffset":0,"dependsOnIndices":[]},
        {"title":"BSR compliance gap analysis","description":"Analyze documents against BSR requirements to identify gaps","category":"Compliance Analysis","priority":"high","estimatedHours":8,"dayOffset":2,"dependsOnIndices":[0]},
        {"title":"Create gap analysis report","description":"Document all identified gaps with recommended actions","category":"Reporting","priority":"high","estimatedHours":6,"dayOffset":5,"dependsOnIndices":[1]},
        {"title":"Internal review of findings","description":"QA review of gap analysis before client presentation","category":"QA","priority":"medium","estimatedHours":2,"dayOffset":7,"dependsOnIndices":[2]},
        {"title":"Prepare client presentation","description":"Create presentation deck summarizing key findings","category":"Client Delivery","priority":"high","estimatedHours":3,"dayOffset":8,"dependsOnIndices":[3]},
        {"title":"Client presentation meeting","description":"Present findings and recommendations to client","category":"Client Delivery","priority":"high","estimatedHours":2,"dayOffset":10,"dependsOnIndices":[4]}
    ]',
    '[
        {"name":"Initial Review Complete","dayOffset":2},
        {"name":"Gap Analysis Complete","dayOffset":7},
        {"name":"Client Delivery","dayOffset":10}
    ]',
    '["gap-assessment","bsr-compliance"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Full Pack Preparation Template
(
    'full-pack-prep-template',
    'full_pack_prep',
    'Full Pack Preparation',
    'Complete submission pack preparation from start to finish',
    30,
    30,
    '[
        {"title":"Kickoff meeting with client","description":"Initial meeting to understand requirements and timeline","category":"Project Setup","priority":"high","estimatedHours":2,"dayOffset":0,"dependsOnIndices":[]},
        {"title":"Collect all required documents","description":"Gather fire strategy, drawings, product data, etc.","category":"Document Collection","priority":"high","estimatedHours":4,"dayOffset":1,"dependsOnIndices":[0]},
        {"title":"Initial document review","description":"Review documents for completeness and quality","category":"Document Review","priority":"high","estimatedHours":6,"dayOffset":3,"dependsOnIndices":[1]},
        {"title":"Identify missing information","description":"List any gaps or missing documents needed from client","category":"Document Review","priority":"high","estimatedHours":3,"dayOffset":5,"dependsOnIndices":[2]},
        {"title":"Request additional information","description":"Follow up with client for missing items","category":"Client Communication","priority":"medium","estimatedHours":1,"dayOffset":6,"dependsOnIndices":[3]},
        {"title":"Fire strategy review","description":"Detailed review of fire strategy document","category":"Technical Review","priority":"high","estimatedHours":8,"dayOffset":8,"dependsOnIndices":[2]},
        {"title":"Drawings and plans review","description":"Review all architectural and fire safety drawings","category":"Technical Review","priority":"high","estimatedHours":6,"dayOffset":10,"dependsOnIndices":[2]},
        {"title":"Product data verification","description":"Verify all products have valid certifications","category":"Technical Review","priority":"high","estimatedHours":4,"dayOffset":12,"dependsOnIndices":[2]},
        {"title":"BSR compliance check","description":"Full compliance check against BSR requirements","category":"Compliance","priority":"high","estimatedHours":10,"dayOffset":14,"dependsOnIndices":[5,6,7]},
        {"title":"Draft submission pack","description":"Compile all documents into submission format","category":"Pack Assembly","priority":"high","estimatedHours":8,"dayOffset":18,"dependsOnIndices":[8]},
        {"title":"Internal QA review","description":"Quality assurance check of complete pack","category":"QA","priority":"high","estimatedHours":6,"dayOffset":21,"dependsOnIndices":[9]},
        {"title":"Address QA findings","description":"Make corrections based on QA feedback","category":"Revisions","priority":"high","estimatedHours":4,"dayOffset":23,"dependsOnIndices":[10]},
        {"title":"Final client review","description":"Share draft pack with client for approval","category":"Client Delivery","priority":"high","estimatedHours":2,"dayOffset":25,"dependsOnIndices":[11]},
        {"title":"Incorporate client feedback","description":"Make final revisions per client comments","category":"Revisions","priority":"medium","estimatedHours":3,"dayOffset":27,"dependsOnIndices":[12]},
        {"title":"Final pack delivery","description":"Deliver completed submission pack to client","category":"Client Delivery","priority":"high","estimatedHours":2,"dayOffset":30,"dependsOnIndices":[13]}
    ]',
    '[
        {"name":"Kickoff Complete","dayOffset":1},
        {"name":"Document Collection Complete","dayOffset":8},
        {"name":"Technical Review Complete","dayOffset":14},
        {"name":"Draft Pack Complete","dayOffset":21},
        {"name":"Client Delivery","dayOffset":30}
    ]',
    '["full-pack","bsr-compliance"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Compliance Review Template
(
    'compliance-review-template',
    'compliance_review',
    'Compliance Review',
    'Review and verify existing submission pack',
    14,
    14,
    '[
        {"title":"Receive submission pack","description":"Download and organize all submission documents","category":"Setup","priority":"high","estimatedHours":1,"dayOffset":0,"dependsOnIndices":[]},
        {"title":"Document completeness check","description":"Verify all required documents are present","category":"Document Review","priority":"high","estimatedHours":3,"dayOffset":0,"dependsOnIndices":[0]},
        {"title":"Fire strategy compliance review","description":"Review fire strategy against BSR requirements","category":"Compliance","priority":"high","estimatedHours":6,"dayOffset":2,"dependsOnIndices":[1]},
        {"title":"Drawings compliance review","description":"Review drawings for compliance and accuracy","category":"Compliance","priority":"high","estimatedHours":5,"dayOffset":4,"dependsOnIndices":[1]},
        {"title":"Product certification verification","description":"Check all products have valid certifications","category":"Compliance","priority":"high","estimatedHours":4,"dayOffset":6,"dependsOnIndices":[1]},
        {"title":"Identify non-compliances","description":"Document all compliance issues found","category":"Reporting","priority":"high","estimatedHours":4,"dayOffset":8,"dependsOnIndices":[2,3,4]},
        {"title":"Create compliance report","description":"Draft detailed report with findings and recommendations","category":"Reporting","priority":"high","estimatedHours":6,"dayOffset":10,"dependsOnIndices":[5]},
        {"title":"Internal QA review","description":"Quality check of compliance report","category":"QA","priority":"medium","estimatedHours":2,"dayOffset":12,"dependsOnIndices":[6]},
        {"title":"Finalize and deliver report","description":"Deliver compliance review report to client","category":"Client Delivery","priority":"high","estimatedHours":2,"dayOffset":14,"dependsOnIndices":[7]}
    ]',
    '[
        {"name":"Document Review Complete","dayOffset":6},
        {"name":"Compliance Analysis Complete","dayOffset":10},
        {"name":"Report Delivery","dayOffset":14}
    ]',
    '["compliance-review","bsr"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),

-- Ongoing Support Template
(
    'ongoing-support-template',
    'ongoing_support',
    'Ongoing Support',
    'Continuous compliance monitoring and support',
    30,
    NULL,
    '[
        {"title":"Monthly compliance review","description":"Review any changes to regulations or guidance","category":"Monitoring","priority":"medium","estimatedHours":2,"dayOffset":0,"dependsOnIndices":[]},
        {"title":"Check for regulation updates","description":"Monitor for BSR regulatory updates","category":"Monitoring","priority":"medium","estimatedHours":1,"dayOffset":0,"dependsOnIndices":[]},
        {"title":"Review client change requests","description":"Assess impact of any client-requested changes","category":"Change Management","priority":"medium","estimatedHours":3,"dayOffset":5,"dependsOnIndices":[]},
        {"title":"Update documentation","description":"Update pack documents if changes required","category":"Documentation","priority":"medium","estimatedHours":4,"dayOffset":10,"dependsOnIndices":[2]},
        {"title":"Monthly status report","description":"Provide monthly update to client","category":"Reporting","priority":"low","estimatedHours":1,"dayOffset":30,"dependsOnIndices":[]}
    ]',
    '[
        {"name":"Monthly Review","dayOffset":5},
        {"name":"Monthly Report","dayOffset":30}
    ]',
    '["ongoing-support","monitoring"]',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
