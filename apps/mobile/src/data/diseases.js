// Copyright (c) 2026 World Class Scholars, led by Dr Christopher Appiah-Thompson. All rights reserved.
/**
 * Comprehensive Disease & Condition Database
 * ═══════════════════════════════════════════════════════════
 *
 * Based on WHO ICD-11 (International Classification of Diseases, 11th Revision)
 * with SNOMED CT cross-references where available.
 *
 * Structure follows ICD-11 chapter organisation:
 *   Chapters 01–26 covering the full spectrum of human diseases,
 *   plus supplementary V/X codes for external causes, traditional medicine,
 *   and extension codes.
 *
 * Each entry: { icd11, snomed?, title, chapter, category, tags[] }
 *   - icd11:    ICD-11 code (MMS linearization)
 *   - snomed:   SNOMED CT concept ID (null if no direct map)
 *   - title:    Preferred clinical term
 *   - chapter:  ICD-11 chapter number (01-26)
 *   - category: Clinical grouping for UI filtering
 *   - tags:     Searchable keywords (symptoms, synonyms, lay terms)
 *
 * Sources:
 *   WHO ICD-11 MMS 2024-01 release
 *   SNOMED CT International Edition 2024-03-01
 *   Australian Refined Diagnosis Related Groups (AR-DRG) v11
 *   Royal Australian College of General Practitioners (RACGP) Silver Book
 */

// ─── ICD-11 CHAPTER LABELS ─────────────────────────────────

export const ICD11_CHAPTERS = {
  '01': 'Infectious or Parasitic Diseases',
  '02': 'Neoplasms',
  '03': 'Diseases of the Blood',
  '04': 'Diseases of the Immune System',
  '05': 'Endocrine, Nutritional or Metabolic Diseases',
  '06': 'Mental, Behavioural or Neurodevelopmental Disorders',
  '07': 'Sleep-Wake Disorders',
  '08': 'Diseases of the Nervous System',
  '09': 'Diseases of the Visual System',
  '10': 'Diseases of the Ear',
  '11': 'Diseases of the Circulatory System',
  '12': 'Diseases of the Respiratory System',
  '13': 'Diseases of the Digestive System',
  '14': 'Diseases of the Skin',
  '15': 'Diseases of the Musculoskeletal System',
  '16': 'Diseases of the Genitourinary System',
  '17': 'Conditions Related to Sexual Health',
  '18': 'Pregnancy, Childbirth or the Puerperium',
  '19': 'Certain Conditions Originating in the Perinatal Period',
  '20': 'Developmental Anomalies',
  '21': 'Symptoms, Signs or Clinical Findings NEC',
  '22': 'Injury, Poisoning or External Causes',
  '23': 'External Causes of Morbidity or Mortality',
  '24': 'Factors Influencing Health Status',
  '25': 'Codes for Special Purposes',
  '26': 'Supplementary Chapter: Traditional Medicine',
};

// ─── CLINICAL CATEGORIES (for UI filter chips) ────────────

export const CATEGORIES = [
  'Aged Care Priority',
  'Infectious Disease',
  'Cancer',
  'Blood Disorder',
  'Immune Disorder',
  'Endocrine & Metabolic',
  'Mental Health',
  'Sleep Disorder',
  'Neurological',
  'Eye & Vision',
  'Ear & Hearing',
  'Cardiovascular',
  'Respiratory',
  'Digestive',
  'Skin',
  'Musculoskeletal',
  'Kidney & Urinary',
  'Reproductive & Sexual Health',
  'Pregnancy & Childbirth',
  'Paediatric',
  'Congenital',
  'Injury & Poisoning',
];

// ─── FULL DISEASE DATABASE ────────────────────────────────

export const DISEASES = [

  // ═══════════════════════════════════════════════════════
  // CHAPTER 01 — INFECTIOUS OR PARASITIC DISEASES
  // ═══════════════════════════════════════════════════════
  { icd11: '1A00', snomed: '56717001', title: 'Tuberculosis', chapter: '01', category: 'Infectious Disease', tags: ['TB', 'lung', 'mycobacterium', 'cough', 'respiratory'] },
  { icd11: '1A01', snomed: '154283005', title: 'Pulmonary tuberculosis', chapter: '01', category: 'Infectious Disease', tags: ['lung TB', 'cough', 'sputum'] },
  { icd11: '1A40', snomed: '40468003', title: 'Plague', chapter: '01', category: 'Infectious Disease', tags: ['yersinia', 'pestis'] },
  { icd11: '1A50', snomed: '409498004', title: 'Anthrax', chapter: '01', category: 'Infectious Disease', tags: ['bacillus anthracis', 'bioterror'] },
  { icd11: '1B10', snomed: '6142004', title: 'Influenza', chapter: '01', category: 'Infectious Disease', tags: ['flu', 'viral', 'fever', 'respiratory'] },
  { icd11: '1B11', snomed: null, title: 'Avian influenza', chapter: '01', category: 'Infectious Disease', tags: ['bird flu', 'H5N1', 'H7N9'] },
  { icd11: '1B21', snomed: '27619001', title: 'Measles', chapter: '01', category: 'Infectious Disease', tags: ['rubeola', 'rash', 'morbillivirus'] },
  { icd11: '1B23', snomed: '36989005', title: 'Mumps', chapter: '01', category: 'Infectious Disease', tags: ['parotitis', 'swelling'] },
  { icd11: '1B24', snomed: '36653000', title: 'Rubella', chapter: '01', category: 'Infectious Disease', tags: ['german measles', 'rash'] },
  { icd11: '1B30', snomed: '38907003', title: 'Varicella (Chickenpox)', chapter: '01', category: 'Infectious Disease', tags: ['chickenpox', 'VZV', 'herpes zoster', 'blisters'] },
  { icd11: '1B31', snomed: '4740000', title: 'Herpes zoster (Shingles)', chapter: '01', category: 'Infectious Disease', tags: ['shingles', 'VZV reactivation', 'nerve pain', 'rash'] },
  { icd11: '1B40', snomed: '186747009', title: 'Dengue fever', chapter: '01', category: 'Infectious Disease', tags: ['mosquito', 'tropical', 'haemorrhagic'] },
  { icd11: '1B50', snomed: '61462000', title: 'Malaria', chapter: '01', category: 'Infectious Disease', tags: ['plasmodium', 'mosquito', 'tropical'] },
  { icd11: '1B70', snomed: '66071002', title: 'Hepatitis B', chapter: '01', category: 'Infectious Disease', tags: ['HBV', 'liver', 'viral hepatitis'] },
  { icd11: '1B71', snomed: '50711007', title: 'Hepatitis C', chapter: '01', category: 'Infectious Disease', tags: ['HCV', 'liver', 'blood-borne'] },
  { icd11: '1C60', snomed: '19030005', title: 'HIV disease', chapter: '01', category: 'Infectious Disease', tags: ['AIDS', 'human immunodeficiency virus', 'retrovirus'] },
  { icd11: '1C80', snomed: '240589008', title: 'Syphilis', chapter: '01', category: 'Infectious Disease', tags: ['treponema', 'STI', 'sexually transmitted'] },
  { icd11: '1C81', snomed: '15628003', title: 'Gonorrhoea', chapter: '01', category: 'Infectious Disease', tags: ['neisseria', 'STI', 'urethritis'] },
  { icd11: '1D00', snomed: '186150001', title: 'Typhoid fever', chapter: '01', category: 'Infectious Disease', tags: ['salmonella typhi', 'enteric fever'] },
  { icd11: '1D01', snomed: '4834000', title: 'Cholera', chapter: '01', category: 'Infectious Disease', tags: ['vibrio', 'diarrhoea', 'dehydration'] },
  { icd11: '1E30', snomed: '409966000', title: 'Clostridioides difficile infection', chapter: '01', category: 'Infectious Disease', tags: ['C. diff', 'pseudomembranous colitis', 'diarrhoea', 'antibiotic'] },
  { icd11: '1E50', snomed: '128241005', title: 'Staphylococcal infection', chapter: '01', category: 'Infectious Disease', tags: ['MRSA', 'staph', 'skin', 'sepsis'] },
  { icd11: '1E51', snomed: '56275007', title: 'Streptococcal infection', chapter: '01', category: 'Infectious Disease', tags: ['strep', 'pharyngitis', 'cellulitis'] },
  { icd11: '1E90', snomed: '40733004', title: 'Infectious mononucleosis', chapter: '01', category: 'Infectious Disease', tags: ['glandular fever', 'EBV', 'Epstein-Barr'] },
  { icd11: '1F00', snomed: '26726000', title: 'Candidiasis', chapter: '01', category: 'Infectious Disease', tags: ['thrush', 'yeast', 'fungal'] },
  { icd11: 'RA01', snomed: '840539006', title: 'COVID-19', chapter: '01', category: 'Infectious Disease', tags: ['SARS-CoV-2', 'coronavirus', 'pandemic', 'respiratory'] },
  { icd11: '1G00', snomed: '75702008', title: 'Sepsis', chapter: '01', category: 'Infectious Disease', tags: ['septicaemia', 'bloodstream infection', 'shock'] },
  { icd11: '1D80', snomed: '302809008', title: 'Urinary tract infection', chapter: '01', category: 'Infectious Disease', tags: ['UTI', 'cystitis', 'bladder', 'burning'] },
  { icd11: '1B25', snomed: '186639003', title: 'Whooping cough', chapter: '01', category: 'Infectious Disease', tags: ['pertussis', 'bordetella', 'cough'] },
  { icd11: '1A80', snomed: '76902006', title: 'Tetanus', chapter: '01', category: 'Infectious Disease', tags: ['lockjaw', 'clostridium tetani'] },
  { icd11: '1A81', snomed: '14168008', title: 'Rabies', chapter: '01', category: 'Infectious Disease', tags: ['hydrophobia', 'animal bite'] },
  { icd11: '1C12', snomed: '398565003', title: 'Chlamydia', chapter: '01', category: 'Infectious Disease', tags: ['STI', 'urethritis', 'pelvic inflammatory'] },
  { icd11: '1B90', snomed: '386661006', title: 'Fever of unknown origin', chapter: '01', category: 'Infectious Disease', tags: ['pyrexia', 'FUO', 'unexplained fever'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 02 — NEOPLASMS (CANCERS)
  // ═══════════════════════════════════════════════════════
  { icd11: '2A00', snomed: '363346000', title: 'Malignant neoplasm of mouth', chapter: '02', category: 'Cancer', tags: ['oral cancer', 'tongue', 'lip'] },
  { icd11: '2B00', snomed: '363349007', title: 'Malignant neoplasm of oesophagus', chapter: '02', category: 'Cancer', tags: ['esophageal cancer', 'swallowing'] },
  { icd11: '2B50', snomed: '363358000', title: 'Malignant neoplasm of stomach', chapter: '02', category: 'Cancer', tags: ['gastric cancer', 'stomach cancer'] },
  { icd11: '2B60', snomed: '363406005', title: 'Malignant neoplasm of colon', chapter: '02', category: 'Cancer', tags: ['bowel cancer', 'colorectal', 'CRC'] },
  { icd11: '2B61', snomed: '363510005', title: 'Malignant neoplasm of rectum', chapter: '02', category: 'Cancer', tags: ['rectal cancer', 'colorectal'] },
  { icd11: '2B70', snomed: '363353009', title: 'Malignant neoplasm of liver', chapter: '02', category: 'Cancer', tags: ['hepatocellular carcinoma', 'HCC', 'liver cancer'] },
  { icd11: '2B80', snomed: '363418001', title: 'Malignant neoplasm of pancreas', chapter: '02', category: 'Cancer', tags: ['pancreatic cancer', 'adenocarcinoma'] },
  { icd11: '2C00', snomed: '254637007', title: 'Malignant neoplasm of lung', chapter: '02', category: 'Cancer', tags: ['lung cancer', 'bronchogenic', 'NSCLC', 'SCLC', 'smoking'] },
  { icd11: '2C20', snomed: '363392001', title: 'Malignant melanoma of skin', chapter: '02', category: 'Cancer', tags: ['melanoma', 'skin cancer', 'mole'] },
  { icd11: '2C30', snomed: '254701007', title: 'Malignant neoplasm of breast', chapter: '02', category: 'Cancer', tags: ['breast cancer', 'mammary', 'lump'] },
  { icd11: '2C60', snomed: '363354003', title: 'Malignant neoplasm of cervix', chapter: '02', category: 'Cancer', tags: ['cervical cancer', 'HPV', 'Pap smear'] },
  { icd11: '2C61', snomed: '363355002', title: 'Malignant neoplasm of uterus', chapter: '02', category: 'Cancer', tags: ['endometrial cancer', 'uterine cancer'] },
  { icd11: '2C70', snomed: '363365005', title: 'Malignant neoplasm of ovary', chapter: '02', category: 'Cancer', tags: ['ovarian cancer'] },
  { icd11: '2C80', snomed: '399068003', title: 'Malignant neoplasm of prostate', chapter: '02', category: 'Cancer', tags: ['prostate cancer', 'PSA', 'urinary'] },
  { icd11: '2C81', snomed: '363432004', title: 'Malignant neoplasm of testis', chapter: '02', category: 'Cancer', tags: ['testicular cancer'] },
  { icd11: '2C90', snomed: '363509009', title: 'Malignant neoplasm of kidney', chapter: '02', category: 'Cancer', tags: ['renal cell carcinoma', 'kidney cancer'] },
  { icd11: '2C91', snomed: '363432004', title: 'Malignant neoplasm of bladder', chapter: '02', category: 'Cancer', tags: ['bladder cancer', 'transitional cell'] },
  { icd11: '2D00', snomed: '93880001', title: 'Malignant neoplasm of brain', chapter: '02', category: 'Cancer', tags: ['brain tumour', 'glioma', 'glioblastoma'] },
  { icd11: '2D10', snomed: '363478007', title: 'Malignant neoplasm of thyroid', chapter: '02', category: 'Cancer', tags: ['thyroid cancer', 'papillary', 'follicular'] },
  { icd11: '2A60', snomed: '93143009', title: 'Leukaemia', chapter: '02', category: 'Cancer', tags: ['leukemia', 'blood cancer', 'ALL', 'AML', 'CLL', 'CML'] },
  { icd11: '2A80', snomed: '118600007', title: 'Lymphoma', chapter: '02', category: 'Cancer', tags: ['Hodgkin', 'non-Hodgkin', 'lymph node', 'NHL'] },
  { icd11: '2A81', snomed: '109989006', title: 'Multiple myeloma', chapter: '02', category: 'Cancer', tags: ['plasma cell', 'bone marrow', 'myeloma'] },
  { icd11: '2E00', snomed: '254637007', title: 'Non-melanoma skin cancer', chapter: '02', category: 'Cancer', tags: ['BCC', 'SCC', 'basal cell', 'squamous cell', 'skin cancer'] },
  { icd11: '2D41', snomed: '372063008', title: 'Mesothelioma', chapter: '02', category: 'Cancer', tags: ['asbestos', 'pleural', 'lung lining'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 03 — DISEASES OF THE BLOOD
  // ═══════════════════════════════════════════════════════
  { icd11: '3A00', snomed: '87522002', title: 'Iron deficiency anaemia', chapter: '03', category: 'Blood Disorder', tags: ['anemia', 'low iron', 'fatigue', 'pallor'] },
  { icd11: '3A01', snomed: '56399007', title: 'Vitamin B12 deficiency anaemia', chapter: '03', category: 'Blood Disorder', tags: ['pernicious anaemia', 'B12', 'macrocytic'] },
  { icd11: '3A02', snomed: '267560002', title: 'Folate deficiency anaemia', chapter: '03', category: 'Blood Disorder', tags: ['folic acid', 'megaloblastic'] },
  { icd11: '3A10', snomed: '127040003', title: 'Sickle cell disease', chapter: '03', category: 'Blood Disorder', tags: ['sickle cell anaemia', 'haemoglobin S', 'vaso-occlusive'] },
  { icd11: '3A20', snomed: '40108008', title: 'Thalassaemia', chapter: '03', category: 'Blood Disorder', tags: ['alpha', 'beta', 'haemoglobin', 'Mediterranean anaemia'] },
  { icd11: '3A30', snomed: '302215000', title: 'Aplastic anaemia', chapter: '03', category: 'Blood Disorder', tags: ['bone marrow failure', 'pancytopenia'] },
  { icd11: '3A40', snomed: '28293008', title: 'Haemolytic anaemia', chapter: '03', category: 'Blood Disorder', tags: ['red cell destruction', 'jaundice'] },
  { icd11: '3B00', snomed: '49601007', title: 'Haemophilia', chapter: '03', category: 'Blood Disorder', tags: ['bleeding disorder', 'clotting factor', 'factor VIII', 'factor IX'] },
  { icd11: '3B10', snomed: '61938002', title: 'Von Willebrand disease', chapter: '03', category: 'Blood Disorder', tags: ['bleeding', 'VWD', 'clotting'] },
  { icd11: '3B20', snomed: '64779008', title: 'Thrombocytopenia', chapter: '03', category: 'Blood Disorder', tags: ['low platelets', 'ITP', 'purpura', 'bleeding'] },
  { icd11: '3B50', snomed: '439127006', title: 'Thrombophilia', chapter: '03', category: 'Blood Disorder', tags: ['hypercoagulable', 'DVT risk', 'clotting tendency'] },
  { icd11: '3B51', snomed: '234466008', title: 'Disseminated intravascular coagulation', chapter: '03', category: 'Blood Disorder', tags: ['DIC', 'coagulopathy', 'bleeding', 'clotting'] },
  { icd11: '3C00', snomed: '109995007', title: 'Polycythaemia vera', chapter: '03', category: 'Blood Disorder', tags: ['PV', 'myeloproliferative', 'high red cells'] },
  { icd11: '3C10', snomed: '440381005', title: 'Neutropenia', chapter: '03', category: 'Blood Disorder', tags: ['low neutrophils', 'infection risk', 'febrile'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 04 — DISEASES OF THE IMMUNE SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '4A00', snomed: '36138009', title: 'Immunodeficiency', chapter: '04', category: 'Immune Disorder', tags: ['immune deficiency', 'infection susceptibility'] },
  { icd11: '4A20', snomed: '24526004', title: 'Inflammatory bowel disease', chapter: '04', category: 'Immune Disorder', tags: ['IBD', 'autoimmune', 'gut'] },
  { icd11: '4A40', snomed: '55464009', title: 'Systemic lupus erythematosus', chapter: '04', category: 'Immune Disorder', tags: ['SLE', 'lupus', 'autoimmune', 'butterfly rash'] },
  { icd11: '4A41', snomed: '31996006', title: 'Vasculitis', chapter: '04', category: 'Immune Disorder', tags: ['blood vessel inflammation', 'autoimmune'] },
  { icd11: '4A42', snomed: '396332003', title: 'Sarcoidosis', chapter: '04', category: 'Immune Disorder', tags: ['granulomatous', 'lung', 'lymph nodes'] },
  { icd11: '4A50', snomed: '232347008', title: 'Anaphylaxis', chapter: '04', category: 'Immune Disorder', tags: ['allergic reaction', 'severe allergy', 'epipen', 'shock'] },
  { icd11: '4A51', snomed: '91936005', title: 'Allergic rhinitis', chapter: '04', category: 'Immune Disorder', tags: ['hay fever', 'sneezing', 'pollen', 'nasal'] },
  { icd11: '4A52', snomed: '389145006', title: 'Food allergy', chapter: '04', category: 'Immune Disorder', tags: ['peanut', 'shellfish', 'anaphylaxis', 'intolerance'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 05 — ENDOCRINE, NUTRITIONAL OR METABOLIC
  // ═══════════════════════════════════════════════════════
  { icd11: '5A10', snomed: '46635009', title: 'Type 1 diabetes mellitus', chapter: '05', category: 'Endocrine & Metabolic', tags: ['T1DM', 'insulin dependent', 'juvenile diabetes', 'autoimmune'] },
  { icd11: '5A11', snomed: '44054006', title: 'Type 2 diabetes mellitus', chapter: '05', category: 'Endocrine & Metabolic', tags: ['T2DM', 'insulin resistance', 'metabolic', 'sugar'] },
  { icd11: '5A12', snomed: '11687002', title: 'Gestational diabetes', chapter: '05', category: 'Endocrine & Metabolic', tags: ['GDM', 'pregnancy diabetes'] },
  { icd11: '5A00', snomed: '73211009', title: 'Diabetes mellitus (unspecified)', chapter: '05', category: 'Endocrine & Metabolic', tags: ['diabetes', 'hyperglycaemia', 'blood sugar'] },
  { icd11: '5A20', snomed: '40930008', title: 'Hypothyroidism', chapter: '05', category: 'Endocrine & Metabolic', tags: ['underactive thyroid', 'Hashimoto', 'TSH', 'fatigue', 'weight gain'] },
  { icd11: '5A21', snomed: '34486009', title: 'Hyperthyroidism', chapter: '05', category: 'Endocrine & Metabolic', tags: ['overactive thyroid', 'Graves', 'thyrotoxicosis', 'weight loss'] },
  { icd11: '5A22', snomed: '190268003', title: 'Goitre', chapter: '05', category: 'Endocrine & Metabolic', tags: ['thyroid enlargement', 'neck swelling'] },
  { icd11: '5A30', snomed: '47270006', title: "Cushing's syndrome", chapter: '05', category: 'Endocrine & Metabolic', tags: ['cortisol excess', 'adrenal', 'moon face'] },
  { icd11: '5A31', snomed: '363732003', title: "Addison's disease", chapter: '05', category: 'Endocrine & Metabolic', tags: ['adrenal insufficiency', 'cortisol', 'fatigue', 'hyperpigmentation'] },
  { icd11: '5A40', snomed: '36348003', title: 'Hyperparathyroidism', chapter: '05', category: 'Endocrine & Metabolic', tags: ['calcium', 'PTH', 'kidney stones'] },
  { icd11: '5B00', snomed: '238136002', title: 'Obesity', chapter: '05', category: 'Endocrine & Metabolic', tags: ['BMI', 'overweight', 'morbid obesity', 'weight'] },
  { icd11: '5B01', snomed: '272588001', title: 'Malnutrition', chapter: '05', category: 'Endocrine & Metabolic', tags: ['undernutrition', 'wasting', 'cachexia', 'protein-energy'] },
  { icd11: '5B02', snomed: '190639004', title: 'Vitamin D deficiency', chapter: '05', category: 'Endocrine & Metabolic', tags: ['rickets', 'osteomalacia', 'sunshine vitamin'] },
  { icd11: '5B10', snomed: '13644009', title: 'Hypercholesterolaemia', chapter: '05', category: 'Endocrine & Metabolic', tags: ['high cholesterol', 'dyslipidaemia', 'lipids', 'statins'] },
  { icd11: '5C00', snomed: '190447002', title: 'Gout', chapter: '05', category: 'Endocrine & Metabolic', tags: ['uric acid', 'joint pain', 'big toe', 'crystal arthropathy'] },
  { icd11: '5C10', snomed: '363732003', title: 'Porphyria', chapter: '05', category: 'Endocrine & Metabolic', tags: ['haem synthesis', 'photosensitivity'] },
  { icd11: '5C20', snomed: '190745003', title: 'Hypoglycaemia', chapter: '05', category: 'Endocrine & Metabolic', tags: ['low blood sugar', 'insulin', 'shakiness', 'confusion'] },
  { icd11: '5C30', snomed: '34349009', title: 'Metabolic syndrome', chapter: '05', category: 'Endocrine & Metabolic', tags: ['syndrome X', 'insulin resistance', 'abdominal obesity'] },
  { icd11: '5C40', snomed: '190502001', title: 'Dehydration', chapter: '05', category: 'Endocrine & Metabolic', tags: ['fluid loss', 'electrolyte', 'dry mouth', 'thirst'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 06 — MENTAL, BEHAVIOURAL, NEURODEVELOPMENTAL
  // ═══════════════════════════════════════════════════════
  { icd11: '6A00', snomed: '52448006', title: 'Dementia (unspecified)', chapter: '06', category: 'Mental Health', tags: ['cognitive decline', 'memory loss', 'confusion', 'elderly'] },
  { icd11: '6A01', snomed: '26929004', title: "Dementia due to Alzheimer's disease", chapter: '06', category: 'Mental Health', tags: ['Alzheimer', 'memory', 'progressive', 'plaques', 'tangles'] },
  { icd11: '6A02', snomed: '429998004', title: 'Vascular dementia', chapter: '06', category: 'Mental Health', tags: ['multi-infarct', 'stroke related', 'cognitive'] },
  { icd11: '6A03', snomed: '312991009', title: 'Lewy body dementia', chapter: '06', category: 'Mental Health', tags: ['DLB', 'hallucinations', 'Parkinson', 'fluctuating'] },
  { icd11: '6A04', snomed: '230270009', title: 'Frontotemporal dementia', chapter: '06', category: 'Mental Health', tags: ['FTD', 'Pick disease', 'behavioural', 'language'] },
  { icd11: '6A20', snomed: '35489007', title: 'Major depressive disorder', chapter: '06', category: 'Mental Health', tags: ['depression', 'low mood', 'sadness', 'anhedonia', 'suicidal'] },
  { icd11: '6A21', snomed: '371596008', title: 'Dysthymia (persistent depression)', chapter: '06', category: 'Mental Health', tags: ['chronic depression', 'low-grade', 'persistent'] },
  { icd11: '6A40', snomed: '13746004', title: 'Bipolar disorder', chapter: '06', category: 'Mental Health', tags: ['manic depression', 'mania', 'mood swings'] },
  { icd11: '6A60', snomed: '197480006', title: 'Generalised anxiety disorder', chapter: '06', category: 'Mental Health', tags: ['GAD', 'worry', 'nervousness', 'tension'] },
  { icd11: '6A61', snomed: '371631005', title: 'Panic disorder', chapter: '06', category: 'Mental Health', tags: ['panic attacks', 'palpitations', 'fear'] },
  { icd11: '6A62', snomed: '31781004', title: 'Agoraphobia', chapter: '06', category: 'Mental Health', tags: ['open spaces', 'avoidance', 'crowds'] },
  { icd11: '6A63', snomed: '25501002', title: 'Social anxiety disorder', chapter: '06', category: 'Mental Health', tags: ['social phobia', 'public speaking', 'embarrassment'] },
  { icd11: '6A70', snomed: '386806002', title: 'Obsessive-compulsive disorder', chapter: '06', category: 'Mental Health', tags: ['OCD', 'obsessions', 'compulsions', 'rituals'] },
  { icd11: '6A80', snomed: '47505003', title: 'Post-traumatic stress disorder', chapter: '06', category: 'Mental Health', tags: ['PTSD', 'trauma', 'flashbacks', 'nightmares'] },
  { icd11: '6B00', snomed: '58214004', title: 'Schizophrenia', chapter: '06', category: 'Mental Health', tags: ['psychosis', 'hallucinations', 'delusions', 'thought disorder'] },
  { icd11: '6B01', snomed: '191525009', title: 'Schizoaffective disorder', chapter: '06', category: 'Mental Health', tags: ['psychosis', 'mood', 'mixed'] },
  { icd11: '6B20', snomed: '56882008', title: 'Anorexia nervosa', chapter: '06', category: 'Mental Health', tags: ['eating disorder', 'weight loss', 'body image'] },
  { icd11: '6B21', snomed: '78004001', title: 'Bulimia nervosa', chapter: '06', category: 'Mental Health', tags: ['eating disorder', 'purging', 'binge'] },
  { icd11: '6C40', snomed: '7200002', title: 'Alcoholism', chapter: '06', category: 'Mental Health', tags: ['alcohol use disorder', 'AUD', 'dependence', 'addiction'] },
  { icd11: '6C41', snomed: '66590003', title: 'Substance use disorder', chapter: '06', category: 'Mental Health', tags: ['drug addiction', 'opioid', 'dependence'] },
  { icd11: '6D10', snomed: '47505003', title: 'Adjustment disorder', chapter: '06', category: 'Mental Health', tags: ['stress reaction', 'life event', 'coping'] },
  { icd11: '6E00', snomed: '406506008', title: 'Attention deficit hyperactivity disorder', chapter: '06', category: 'Mental Health', tags: ['ADHD', 'inattention', 'hyperactivity', 'impulsivity'] },
  { icd11: '6E10', snomed: '35919005', title: 'Autism spectrum disorder', chapter: '06', category: 'Mental Health', tags: ['ASD', 'autism', 'Asperger', 'social communication'] },
  { icd11: '6E20', snomed: '110359009', title: 'Intellectual disability', chapter: '06', category: 'Mental Health', tags: ['learning disability', 'cognitive impairment'] },
  { icd11: '6E40', snomed: '59770009', title: 'Delirium', chapter: '06', category: 'Mental Health', tags: ['acute confusion', 'disorientation', 'fluctuating', 'elderly'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 07 — SLEEP-WAKE DISORDERS
  // ═══════════════════════════════════════════════════════
  { icd11: '7A00', snomed: '193462001', title: 'Insomnia', chapter: '07', category: 'Sleep Disorder', tags: ['sleeplessness', 'difficulty sleeping', 'wakefulness'] },
  { icd11: '7A20', snomed: '73430006', title: 'Obstructive sleep apnoea', chapter: '07', category: 'Sleep Disorder', tags: ['OSA', 'snoring', 'CPAP', 'apnea', 'oxygen'] },
  { icd11: '7A40', snomed: '60380001', title: 'Narcolepsy', chapter: '07', category: 'Sleep Disorder', tags: ['excessive sleepiness', 'cataplexy', 'sleep attacks'] },
  { icd11: '7A60', snomed: '32914008', title: 'Restless legs syndrome', chapter: '07', category: 'Sleep Disorder', tags: ['RLS', 'leg discomfort', 'creeping', 'urge to move'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 08 — DISEASES OF THE NERVOUS SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '8A00', snomed: '49049000', title: "Parkinson's disease", chapter: '08', category: 'Neurological', tags: ['tremor', 'rigidity', 'bradykinesia', 'dopamine', 'movement'] },
  { icd11: '8A01', snomed: '24700007', title: 'Multiple sclerosis', chapter: '08', category: 'Neurological', tags: ['MS', 'demyelination', 'relapsing-remitting', 'progressive'] },
  { icd11: '8A02', snomed: '86044005', title: 'Amyotrophic lateral sclerosis', chapter: '08', category: 'Neurological', tags: ['ALS', 'motor neurone disease', 'MND', 'Lou Gehrig'] },
  { icd11: '8A03', snomed: '230258005', title: "Huntington's disease", chapter: '08', category: 'Neurological', tags: ['chorea', 'hereditary', 'movement', 'psychiatric'] },
  { icd11: '8A10', snomed: '84757009', title: 'Epilepsy', chapter: '08', category: 'Neurological', tags: ['seizure', 'fits', 'convulsion', 'anticonvulsant'] },
  { icd11: '8A11', snomed: '230461009', title: 'Status epilepticus', chapter: '08', category: 'Neurological', tags: ['prolonged seizure', 'emergency'] },
  { icd11: '8A20', snomed: '37796009', title: 'Migraine', chapter: '08', category: 'Neurological', tags: ['headache', 'aura', 'nausea', 'photophobia'] },
  { icd11: '8A21', snomed: '398987004', title: 'Tension-type headache', chapter: '08', category: 'Neurological', tags: ['headache', 'band-like', 'stress'] },
  { icd11: '8A22', snomed: '193003005', title: 'Cluster headache', chapter: '08', category: 'Neurological', tags: ['headache', 'unilateral', 'severe', 'autonomic'] },
  { icd11: '8A30', snomed: '193093009', title: 'Trigeminal neuralgia', chapter: '08', category: 'Neurological', tags: ['facial pain', 'tic douloureux', 'nerve'] },
  { icd11: '8A40', snomed: '128188000', title: 'Neuropathy', chapter: '08', category: 'Neurological', tags: ['peripheral neuropathy', 'tingling', 'numbness', 'diabetic'] },
  { icd11: '8A41', snomed: '57838006', title: "Bell's palsy", chapter: '08', category: 'Neurological', tags: ['facial nerve', 'facial weakness', 'droop'] },
  { icd11: '8A50', snomed: '398100001', title: 'Guillain-Barré syndrome', chapter: '08', category: 'Neurological', tags: ['GBS', 'ascending paralysis', 'autoimmune', 'weakness'] },
  { icd11: '8A60', snomed: '73211009', title: 'Cerebral palsy', chapter: '08', category: 'Neurological', tags: ['CP', 'motor disability', 'spasticity'] },
  { icd11: '8A70', snomed: '230690007', title: 'Meningitis', chapter: '08', category: 'Neurological', tags: ['brain lining infection', 'neck stiffness', 'photophobia'] },
  { icd11: '8A71', snomed: '45170000', title: 'Encephalitis', chapter: '08', category: 'Neurological', tags: ['brain inflammation', 'viral', 'confusion'] },
  { icd11: '8B00', snomed: '414022008', title: 'Essential tremor', chapter: '08', category: 'Neurological', tags: ['tremor', 'hand shaking', 'familial'] },
  { icd11: '8B10', snomed: '230745008', title: 'Myasthenia gravis', chapter: '08', category: 'Neurological', tags: ['muscle weakness', 'autoimmune', 'drooping eyelids', 'fatigue'] },
  { icd11: '8B20', snomed: '69896004', title: 'Spinal cord injury', chapter: '08', category: 'Neurological', tags: ['paraplegia', 'quadriplegia', 'trauma', 'paralysis'] },
  { icd11: '8B30', snomed: '128613002', title: 'Carpal tunnel syndrome', chapter: '08', category: 'Neurological', tags: ['CTS', 'wrist', 'tingling', 'median nerve', 'hand'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 09 — DISEASES OF THE VISUAL SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '9A00', snomed: '193570009', title: 'Cataract', chapter: '09', category: 'Eye & Vision', tags: ['lens opacity', 'cloudy vision', 'surgery'] },
  { icd11: '9A10', snomed: '23986001', title: 'Glaucoma', chapter: '09', category: 'Eye & Vision', tags: ['intraocular pressure', 'optic nerve', 'visual field loss'] },
  { icd11: '9A20', snomed: '267718000', title: 'Age-related macular degeneration', chapter: '09', category: 'Eye & Vision', tags: ['AMD', 'ARMD', 'central vision loss', 'drusen', 'wet', 'dry'] },
  { icd11: '9A30', snomed: '4855003', title: 'Diabetic retinopathy', chapter: '09', category: 'Eye & Vision', tags: ['diabetes eye', 'retinal damage', 'blindness'] },
  { icd11: '9A40', snomed: '193349004', title: 'Retinal detachment', chapter: '09', category: 'Eye & Vision', tags: ['flashes', 'floaters', 'vision loss', 'emergency'] },
  { icd11: '9A50', snomed: '9826008', title: 'Conjunctivitis', chapter: '09', category: 'Eye & Vision', tags: ['pink eye', 'red eye', 'discharge', 'itchy'] },
  { icd11: '9A60', snomed: '111516008', title: 'Dry eye syndrome', chapter: '09', category: 'Eye & Vision', tags: ['keratoconjunctivitis sicca', 'gritty', 'tears'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 10 — DISEASES OF THE EAR
  // ═══════════════════════════════════════════════════════
  { icd11: '10A0', snomed: '15188001', title: 'Hearing loss (sensorineural)', chapter: '10', category: 'Ear & Hearing', tags: ['deafness', 'hearing impairment', 'presbycusis', 'age-related'] },
  { icd11: '10A1', snomed: '44057004', title: 'Conductive hearing loss', chapter: '10', category: 'Ear & Hearing', tags: ['middle ear', 'earwax', 'otosclerosis'] },
  { icd11: '10B0', snomed: '60862001', title: 'Tinnitus', chapter: '10', category: 'Ear & Hearing', tags: ['ringing ears', 'buzzing', 'noise'] },
  { icd11: '10C0', snomed: '399153001', title: 'Vertigo', chapter: '10', category: 'Ear & Hearing', tags: ['dizziness', 'spinning', 'balance', 'BPPV'] },
  { icd11: '10C1', snomed: '13213009', title: "Ménière's disease", chapter: '10', category: 'Ear & Hearing', tags: ['Meniere', 'vertigo', 'hearing loss', 'tinnitus', 'fullness'] },
  { icd11: '10D0', snomed: '65363002', title: 'Otitis media', chapter: '10', category: 'Ear & Hearing', tags: ['middle ear infection', 'earache', 'AOM'] },
  { icd11: '10D1', snomed: '39479005', title: 'Otitis externa', chapter: '10', category: 'Ear & Hearing', tags: ['swimmer ear', 'outer ear infection'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 11 — DISEASES OF THE CIRCULATORY SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '11A0', snomed: '38341003', title: 'Essential hypertension', chapter: '11', category: 'Cardiovascular', tags: ['high blood pressure', 'BP', 'systolic', 'diastolic'] },
  { icd11: '11A1', snomed: '48194001', title: 'Secondary hypertension', chapter: '11', category: 'Cardiovascular', tags: ['renal hypertension', 'endocrine'] },
  { icd11: '11A2', snomed: '70995007', title: 'Pulmonary hypertension', chapter: '11', category: 'Cardiovascular', tags: ['PAH', 'right heart', 'pulmonary arterial'] },
  { icd11: '11B0', snomed: '53741008', title: 'Coronary artery disease', chapter: '11', category: 'Cardiovascular', tags: ['CAD', 'ischaemic heart disease', 'IHD', 'angina', 'atherosclerosis'] },
  { icd11: '11B1', snomed: '22298006', title: 'Myocardial infarction', chapter: '11', category: 'Cardiovascular', tags: ['heart attack', 'MI', 'STEMI', 'NSTEMI', 'chest pain'] },
  { icd11: '11B2', snomed: '194828000', title: 'Angina pectoris', chapter: '11', category: 'Cardiovascular', tags: ['chest pain', 'exertional', 'GTN', 'stable', 'unstable'] },
  { icd11: '11C0', snomed: '84114007', title: 'Heart failure', chapter: '11', category: 'Cardiovascular', tags: ['CHF', 'congestive', 'HFrEF', 'HFpEF', 'breathless', 'oedema'] },
  { icd11: '11C1', snomed: '271807003', title: 'Cardiomyopathy', chapter: '11', category: 'Cardiovascular', tags: ['dilated', 'hypertrophic', 'restrictive', 'heart muscle'] },
  { icd11: '11D0', snomed: '49436004', title: 'Atrial fibrillation', chapter: '11', category: 'Cardiovascular', tags: ['AF', 'AFib', 'irregular heartbeat', 'arrhythmia', 'anticoagulant'] },
  { icd11: '11D1', snomed: '44808001', title: 'Atrial flutter', chapter: '11', category: 'Cardiovascular', tags: ['arrhythmia', 'rapid heart'] },
  { icd11: '11D2', snomed: '233917008', title: 'Ventricular tachycardia', chapter: '11', category: 'Cardiovascular', tags: ['VT', 'fast heart', 'arrhythmia', 'life-threatening'] },
  { icd11: '11D3', snomed: '27885002', title: 'Ventricular fibrillation', chapter: '11', category: 'Cardiovascular', tags: ['VF', 'cardiac arrest', 'defibrillation'] },
  { icd11: '11D4', snomed: '233917008', title: 'Supraventricular tachycardia', chapter: '11', category: 'Cardiovascular', tags: ['SVT', 'palpitations', 'fast heart'] },
  { icd11: '11D5', snomed: '6374002', title: 'Bundle branch block', chapter: '11', category: 'Cardiovascular', tags: ['RBBB', 'LBBB', 'conduction', 'ECG'] },
  { icd11: '11D6', snomed: '233916004', title: 'Heart block', chapter: '11', category: 'Cardiovascular', tags: ['AV block', 'first degree', 'second degree', 'third degree', 'pacemaker'] },
  { icd11: '11E0', snomed: '48601002', title: 'Aortic valve stenosis', chapter: '11', category: 'Cardiovascular', tags: ['aortic stenosis', 'valve', 'calcification', 'murmur'] },
  { icd11: '11E1', snomed: '79619009', title: 'Mitral regurgitation', chapter: '11', category: 'Cardiovascular', tags: ['mitral valve', 'insufficiency', 'murmur'] },
  { icd11: '11E2', snomed: '48724000', title: 'Mitral valve prolapse', chapter: '11', category: 'Cardiovascular', tags: ['MVP', 'click-murmur', 'benign'] },
  { icd11: '11F0', snomed: '230690007', title: 'Stroke (cerebrovascular accident)', chapter: '11', category: 'Cardiovascular', tags: ['CVA', 'stroke', 'ischaemic', 'haemorrhagic', 'TIA', 'weakness'] },
  { icd11: '11F1', snomed: '266257000', title: 'Transient ischaemic attack', chapter: '11', category: 'Cardiovascular', tags: ['TIA', 'mini-stroke', 'warning', 'transient'] },
  { icd11: '11G0', snomed: '128053003', title: 'Deep vein thrombosis', chapter: '11', category: 'Cardiovascular', tags: ['DVT', 'blood clot', 'leg swelling', 'anticoagulant'] },
  { icd11: '11G1', snomed: '59282003', title: 'Pulmonary embolism', chapter: '11', category: 'Cardiovascular', tags: ['PE', 'blood clot lung', 'dyspnoea', 'chest pain', 'D-dimer'] },
  { icd11: '11G2', snomed: '195569001', title: 'Peripheral arterial disease', chapter: '11', category: 'Cardiovascular', tags: ['PAD', 'claudication', 'leg pain', 'atherosclerosis'] },
  { icd11: '11G3', snomed: '417219001', title: 'Abdominal aortic aneurysm', chapter: '11', category: 'Cardiovascular', tags: ['AAA', 'aorta', 'rupture risk', 'screening'] },
  { icd11: '11H0', snomed: '128060009', title: 'Varicose veins', chapter: '11', category: 'Cardiovascular', tags: ['leg veins', 'venous insufficiency', 'swelling'] },
  { icd11: '11H1', snomed: '45007003', title: 'Hypotension', chapter: '11', category: 'Cardiovascular', tags: ['low blood pressure', 'dizziness', 'postural', 'orthostatic'] },
  { icd11: '11H2', snomed: '195967001', title: 'Cardiac arrest', chapter: '11', category: 'Cardiovascular', tags: ['asystole', 'PEA', 'CPR', 'resuscitation'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 12 — DISEASES OF THE RESPIRATORY SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '12A0', snomed: '195967001', title: 'Acute upper respiratory infection', chapter: '12', category: 'Respiratory', tags: ['common cold', 'URTI', 'runny nose', 'sore throat'] },
  { icd11: '12A1', snomed: '36971009', title: 'Sinusitis', chapter: '12', category: 'Respiratory', tags: ['sinus', 'facial pain', 'congestion', 'nasal'] },
  { icd11: '12A2', snomed: '195668002', title: 'Pharyngitis', chapter: '12', category: 'Respiratory', tags: ['sore throat', 'tonsillitis', 'strep throat'] },
  { icd11: '12A3', snomed: '55607006', title: 'Laryngitis', chapter: '12', category: 'Respiratory', tags: ['voice loss', 'hoarse', 'vocal cords'] },
  { icd11: '12B0', snomed: '233604007', title: 'Pneumonia', chapter: '12', category: 'Respiratory', tags: ['lung infection', 'consolidation', 'cough', 'fever', 'chest X-ray'] },
  { icd11: '12B1', snomed: '32398004', title: 'Bronchitis', chapter: '12', category: 'Respiratory', tags: ['acute bronchitis', 'cough', 'chest', 'productive'] },
  { icd11: '12B2', snomed: '233607000', title: 'Bronchiolitis', chapter: '12', category: 'Respiratory', tags: ['infant', 'RSV', 'wheezing'] },
  { icd11: '12C0', snomed: '195967001', title: 'Asthma', chapter: '12', category: 'Respiratory', tags: ['wheeze', 'bronchospasm', 'inhaler', 'shortness of breath', 'atopic'] },
  { icd11: '12C1', snomed: '13645005', title: 'Chronic obstructive pulmonary disease', chapter: '12', category: 'Respiratory', tags: ['COPD', 'emphysema', 'chronic bronchitis', 'smoking', 'breathless'] },
  { icd11: '12C2', snomed: '196028003', title: 'Bronchiectasis', chapter: '12', category: 'Respiratory', tags: ['dilated airways', 'chronic cough', 'sputum'] },
  { icd11: '12D0', snomed: '67782005', title: 'Pleural effusion', chapter: '12', category: 'Respiratory', tags: ['fluid around lung', 'breathless', 'dull percussion'] },
  { icd11: '12D1', snomed: '36118008', title: 'Pneumothorax', chapter: '12', category: 'Respiratory', tags: ['collapsed lung', 'air leak', 'chest pain', 'trauma'] },
  { icd11: '12E0', snomed: '51615001', title: 'Pulmonary fibrosis', chapter: '12', category: 'Respiratory', tags: ['IPF', 'interstitial lung disease', 'scarring', 'breathless'] },
  { icd11: '12F0', snomed: '65710008', title: 'Acute respiratory failure', chapter: '12', category: 'Respiratory', tags: ['respiratory failure', 'hypoxia', 'ventilator', 'ICU'] },
  { icd11: '12F1', snomed: '67905004', title: 'Acute respiratory distress syndrome', chapter: '12', category: 'Respiratory', tags: ['ARDS', 'bilateral infiltrates', 'ICU', 'hypoxia'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 13 — DISEASES OF THE DIGESTIVE SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '13A0', snomed: '235595009', title: 'Gastro-oesophageal reflux disease', chapter: '13', category: 'Digestive', tags: ['GORD', 'GERD', 'heartburn', 'acid reflux', 'PPI'] },
  { icd11: '13A1', snomed: '14760008', title: 'Peptic ulcer disease', chapter: '13', category: 'Digestive', tags: ['gastric ulcer', 'duodenal ulcer', 'H. pylori', 'bleeding'] },
  { icd11: '13A2', snomed: '4556007', title: 'Gastritis', chapter: '13', category: 'Digestive', tags: ['stomach inflammation', 'dyspepsia', 'helicobacter'] },
  { icd11: '13B0', snomed: '34000006', title: "Crohn's disease", chapter: '13', category: 'Digestive', tags: ['inflammatory bowel', 'IBD', 'diarrhoea', 'abdominal pain', 'fistula'] },
  { icd11: '13B1', snomed: '64766004', title: 'Ulcerative colitis', chapter: '13', category: 'Digestive', tags: ['inflammatory bowel', 'IBD', 'bloody diarrhoea', 'colon'] },
  { icd11: '13B2', snomed: '396332003', title: 'Irritable bowel syndrome', chapter: '13', category: 'Digestive', tags: ['IBS', 'abdominal pain', 'bloating', 'altered bowel', 'functional'] },
  { icd11: '13B3', snomed: '36883002', title: 'Diverticular disease', chapter: '13', category: 'Digestive', tags: ['diverticulitis', 'diverticulosis', 'colon', 'fibre'] },
  { icd11: '13C0', snomed: '235856003', title: 'Liver cirrhosis', chapter: '13', category: 'Digestive', tags: ['cirrhosis', 'fibrosis', 'alcohol', 'hepatitis', 'portal hypertension'] },
  { icd11: '13C1', snomed: '197321007', title: 'Non-alcoholic fatty liver disease', chapter: '13', category: 'Digestive', tags: ['NAFLD', 'NASH', 'fatty liver', 'metabolic'] },
  { icd11: '13C2', snomed: '40468003', title: 'Hepatic failure', chapter: '13', category: 'Digestive', tags: ['liver failure', 'jaundice', 'encephalopathy'] },
  { icd11: '13D0', snomed: '235919008', title: 'Cholelithiasis (Gallstones)', chapter: '13', category: 'Digestive', tags: ['gallstones', 'biliary colic', 'cholecystitis'] },
  { icd11: '13D1', snomed: '75694006', title: 'Pancreatitis', chapter: '13', category: 'Digestive', tags: ['pancreas inflammation', 'acute', 'chronic', 'alcohol', 'epigastric'] },
  { icd11: '13E0', snomed: '84089009', title: 'Appendicitis', chapter: '13', category: 'Digestive', tags: ['appendix', 'right iliac fossa', 'RIF pain', 'surgical'] },
  { icd11: '13E1', snomed: '396332003', title: 'Intestinal obstruction', chapter: '13', category: 'Digestive', tags: ['bowel obstruction', 'vomiting', 'adhesions', 'hernia'] },
  { icd11: '13E2', snomed: '408643008', title: 'Coeliac disease', chapter: '13', category: 'Digestive', tags: ['celiac', 'gluten intolerance', 'malabsorption', 'villous atrophy'] },
  { icd11: '13F0', snomed: '80394007', title: 'Haemorrhoids', chapter: '13', category: 'Digestive', tags: ['piles', 'rectal bleeding', 'itching', 'anus'] },
  { icd11: '13F1', snomed: '386983007', title: 'Constipation', chapter: '13', category: 'Digestive', tags: ['hard stools', 'infrequent bowel', 'straining', 'laxative'] },
  { icd11: '13F2', snomed: '62315008', title: 'Diarrhoea', chapter: '13', category: 'Digestive', tags: ['loose stools', 'watery', 'gastroenteritis', 'dehydration'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 14 — DISEASES OF THE SKIN
  // ═══════════════════════════════════════════════════════
  { icd11: '14A0', snomed: '24079001', title: 'Atopic dermatitis (Eczema)', chapter: '14', category: 'Skin', tags: ['eczema', 'itchy skin', 'rash', 'flaky', 'atopic'] },
  { icd11: '14A1', snomed: '9014002', title: 'Psoriasis', chapter: '14', category: 'Skin', tags: ['plaques', 'silvery scales', 'autoimmune', 'skin', 'joints'] },
  { icd11: '14A2', snomed: '40275004', title: 'Contact dermatitis', chapter: '14', category: 'Skin', tags: ['allergic', 'irritant', 'rash', 'occupational'] },
  { icd11: '14B0', snomed: '128477000', title: 'Cellulitis', chapter: '14', category: 'Skin', tags: ['skin infection', 'redness', 'swelling', 'warmth', 'antibiotic'] },
  { icd11: '14B1', snomed: '399020009', title: 'Pressure ulcer', chapter: '14', category: 'Skin', tags: ['bedsore', 'pressure injury', 'decubitus', 'wound care', 'stage'] },
  { icd11: '14B2', snomed: '13200003', title: 'Venous leg ulcer', chapter: '14', category: 'Skin', tags: ['leg ulcer', 'chronic wound', 'compression', 'venous insufficiency'] },
  { icd11: '14B3', snomed: '399912005', title: 'Diabetic foot ulcer', chapter: '14', category: 'Skin', tags: ['neuropathic ulcer', 'diabetes', 'wound', 'amputation risk'] },
  { icd11: '14C0', snomed: '61462000', title: 'Urticaria (Hives)', chapter: '14', category: 'Skin', tags: ['hives', 'wheals', 'itchy', 'allergic', 'antihistamine'] },
  { icd11: '14C1', snomed: '271807003', title: 'Herpes simplex', chapter: '14', category: 'Skin', tags: ['cold sore', 'fever blister', 'HSV', 'genital herpes'] },
  { icd11: '14D0', snomed: '239164002', title: 'Scabies', chapter: '14', category: 'Skin', tags: ['mite', 'itching', 'burrow', 'contagious'] },
  { icd11: '14D1', snomed: '414016006', title: 'Tinea (Dermatophyte infection)', chapter: '14', category: 'Skin', tags: ['ringworm', 'athlete foot', 'fungal', 'jock itch'] },
  { icd11: '14E0', snomed: '402196005', title: 'Acne vulgaris', chapter: '14', category: 'Skin', tags: ['acne', 'pimples', 'comedones', 'spots'] },
  { icd11: '14E1', snomed: '200931003', title: 'Rosacea', chapter: '14', category: 'Skin', tags: ['facial redness', 'flushing', 'papules', 'nose'] },
  { icd11: '14F0', snomed: '56153002', title: 'Alopecia', chapter: '14', category: 'Skin', tags: ['hair loss', 'baldness', 'alopecia areata'] },
  { icd11: '14F1', snomed: '400130008', title: 'Seborrhoeic dermatitis', chapter: '14', category: 'Skin', tags: ['dandruff', 'cradle cap', 'flaky scalp'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 15 — DISEASES OF THE MUSCULOSKELETAL SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '15A0', snomed: '396275006', title: 'Osteoarthritis', chapter: '15', category: 'Musculoskeletal', tags: ['OA', 'joint degeneration', 'knee', 'hip', 'pain', 'stiffness'] },
  { icd11: '15A1', snomed: '69896004', title: 'Rheumatoid arthritis', chapter: '15', category: 'Musculoskeletal', tags: ['RA', 'autoimmune', 'joint swelling', 'symmetric', 'hand'] },
  { icd11: '15A2', snomed: '156370009', title: 'Psoriatic arthritis', chapter: '15', category: 'Musculoskeletal', tags: ['psoriasis joints', 'dactylitis', 'enthesitis'] },
  { icd11: '15A3', snomed: '9631008', title: 'Ankylosing spondylitis', chapter: '15', category: 'Musculoskeletal', tags: ['AS', 'spinal', 'sacroiliitis', 'stiffness', 'HLA-B27'] },
  { icd11: '15B0', snomed: '64859006', title: 'Osteoporosis', chapter: '15', category: 'Musculoskeletal', tags: ['bone density', 'fracture risk', 'DEXA', 'bisphosphonate', 'fragility'] },
  { icd11: '15B1', snomed: '40930008', title: 'Osteomalacia', chapter: '15', category: 'Musculoskeletal', tags: ['soft bones', 'vitamin D', 'rickets adults'] },
  { icd11: '15C0', snomed: '22913005', title: 'Low back pain', chapter: '15', category: 'Musculoskeletal', tags: ['lumbago', 'lumbar pain', 'sciatica', 'disc'] },
  { icd11: '15C1', snomed: '23056005', title: 'Sciatica', chapter: '15', category: 'Musculoskeletal', tags: ['leg pain', 'nerve', 'lumbar disc', 'shooting pain'] },
  { icd11: '15C2', snomed: '45352006', title: 'Spinal stenosis', chapter: '15', category: 'Musculoskeletal', tags: ['narrow canal', 'neurogenic claudication', 'back'] },
  { icd11: '15C3', snomed: '7806002', title: 'Cervical spondylosis', chapter: '15', category: 'Musculoskeletal', tags: ['neck pain', 'degenerative', 'cervical disc'] },
  { icd11: '15D0', snomed: '76069003', title: 'Fibromyalgia', chapter: '15', category: 'Musculoskeletal', tags: ['widespread pain', 'tender points', 'fatigue', 'sleep disturbance'] },
  { icd11: '15D1', snomed: '28753001', title: 'Polymyalgia rheumatica', chapter: '15', category: 'Musculoskeletal', tags: ['PMR', 'shoulder stiffness', 'hip stiffness', 'ESR', 'elderly'] },
  { icd11: '15E0', snomed: '64572001', title: 'Fracture (unspecified)', chapter: '15', category: 'Musculoskeletal', tags: ['broken bone', 'trauma', 'cast', 'fixation'] },
  { icd11: '15E1', snomed: '359817006', title: 'Hip fracture', chapter: '15', category: 'Musculoskeletal', tags: ['neck of femur', 'NOF', 'fall', 'elderly', 'surgical'] },
  { icd11: '15E2', snomed: '263102004', title: 'Vertebral fracture', chapter: '15', category: 'Musculoskeletal', tags: ['spinal fracture', 'compression', 'osteoporotic'] },
  { icd11: '15F0', snomed: '35489007', title: 'Rotator cuff injury', chapter: '15', category: 'Musculoskeletal', tags: ['shoulder pain', 'tear', 'impingement'] },
  { icd11: '15F1', snomed: '202855006', title: 'Frozen shoulder', chapter: '15', category: 'Musculoskeletal', tags: ['adhesive capsulitis', 'shoulder stiffness', 'movement loss'] },
  { icd11: '15F2', snomed: '239930003', title: 'Tennis elbow', chapter: '15', category: 'Musculoskeletal', tags: ['lateral epicondylitis', 'elbow pain', 'repetitive'] },
  { icd11: '15G0', snomed: '76107001', title: 'Sarcopenia', chapter: '15', category: 'Musculoskeletal', tags: ['muscle wasting', 'age-related', 'frailty', 'strength loss'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 16 — DISEASES OF THE GENITOURINARY SYSTEM
  // ═══════════════════════════════════════════════════════
  { icd11: '16A0', snomed: '709044004', title: 'Chronic kidney disease', chapter: '16', category: 'Kidney & Urinary', tags: ['CKD', 'renal failure', 'eGFR', 'dialysis', 'nephropathy'] },
  { icd11: '16A1', snomed: '14669001', title: 'Acute kidney injury', chapter: '16', category: 'Kidney & Urinary', tags: ['AKI', 'renal failure', 'creatinine', 'oliguria'] },
  { icd11: '16B0', snomed: '95570007', title: 'Kidney stones (Nephrolithiasis)', chapter: '16', category: 'Kidney & Urinary', tags: ['renal calculi', 'flank pain', 'ureteric colic', 'haematuria'] },
  { icd11: '16B1', snomed: '36225005', title: 'Glomerulonephritis', chapter: '16', category: 'Kidney & Urinary', tags: ['nephritis', 'proteinuria', 'haematuria', 'nephrotic'] },
  { icd11: '16B2', snomed: '45816000', title: 'Nephrotic syndrome', chapter: '16', category: 'Kidney & Urinary', tags: ['proteinuria', 'oedema', 'hypoalbuminaemia'] },
  { icd11: '16C0', snomed: '236648007', title: 'Pyelonephritis', chapter: '16', category: 'Kidney & Urinary', tags: ['kidney infection', 'fever', 'loin pain', 'UTI'] },
  { icd11: '16D0', snomed: '40930008', title: 'Benign prostatic hyperplasia', chapter: '16', category: 'Kidney & Urinary', tags: ['BPH', 'enlarged prostate', 'urinary symptoms', 'LUTS'] },
  { icd11: '16D1', snomed: '87628006', title: 'Urinary incontinence', chapter: '16', category: 'Kidney & Urinary', tags: ['leakage', 'stress', 'urge', 'overflow', 'elderly', 'pelvic floor'] },
  { icd11: '16D2', snomed: '236648007', title: 'Urinary retention', chapter: '16', category: 'Kidney & Urinary', tags: ['unable to urinate', 'catheter', 'bladder'] },
  { icd11: '16E0', snomed: '266569009', title: 'Endometriosis', chapter: '16', category: 'Reproductive & Sexual Health', tags: ['endometrium', 'pelvic pain', 'dysmenorrhoea', 'infertility'] },
  { icd11: '16E1', snomed: '95315005', title: 'Polycystic ovary syndrome', chapter: '16', category: 'Reproductive & Sexual Health', tags: ['PCOS', 'anovulation', 'hirsutism', 'irregular periods'] },
  { icd11: '16E2', snomed: '266601002', title: 'Menopause symptoms', chapter: '16', category: 'Reproductive & Sexual Health', tags: ['hot flushes', 'perimenopause', 'HRT', 'osteoporosis risk'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 21 — SYMPTOMS / CLINICAL FINDINGS NEC
  // ═══════════════════════════════════════════════════════
  { icd11: '21A0', snomed: '68962001', title: 'Chronic pain syndrome', chapter: '21', category: 'Aged Care Priority', tags: ['pain management', 'chronic', 'opioid', 'multimodal'] },
  { icd11: '21A1', snomed: '84229001', title: 'Fatigue', chapter: '21', category: 'Aged Care Priority', tags: ['tiredness', 'lethargy', 'chronic fatigue', 'weakness'] },
  { icd11: '21B0', snomed: '267024001', title: 'Dyspnoea', chapter: '21', category: 'Aged Care Priority', tags: ['shortness of breath', 'breathlessness', 'SOB', 'exertional'] },
  { icd11: '21C0', snomed: '422587007', title: 'Nausea and vomiting', chapter: '21', category: 'Aged Care Priority', tags: ['sick', 'emesis', 'antiemetic'] },
  { icd11: '21D0', snomed: '404640003', title: 'Dizziness', chapter: '21', category: 'Aged Care Priority', tags: ['lightheaded', 'unsteady', 'vertigo', 'presyncope'] },
  { icd11: '21E0', snomed: '271594007', title: 'Syncope (Fainting)', chapter: '21', category: 'Aged Care Priority', tags: ['faint', 'collapse', 'loss of consciousness', 'vasovagal'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 22 — INJURY, POISONING, EXTERNAL CAUSES
  // ═══════════════════════════════════════════════════════
  { icd11: '22A0', snomed: '217082002', title: 'Fall in elderly person', chapter: '22', category: 'Injury & Poisoning', tags: ['falls', 'risk', 'fracture', 'mobility', 'balance'] },
  { icd11: '22A1', snomed: '125605004', title: 'Fracture due to fall', chapter: '22', category: 'Injury & Poisoning', tags: ['broken bone', 'hip fracture', 'wrist', 'osteoporotic'] },
  { icd11: '22B0', snomed: '125666000', title: 'Burns', chapter: '22', category: 'Injury & Poisoning', tags: ['thermal', 'scald', 'chemical', 'skin damage'] },
  { icd11: '22C0', snomed: '75478009', title: 'Poisoning', chapter: '22', category: 'Injury & Poisoning', tags: ['toxicity', 'overdose', 'ingestion', 'accidental'] },
  { icd11: '22C1', snomed: '296289006', title: 'Adverse drug reaction', chapter: '22', category: 'Injury & Poisoning', tags: ['ADR', 'side effect', 'medication', 'allergy'] },

  // ═══════════════════════════════════════════════════════
  // CHAPTER 24 — FACTORS INFLUENCING HEALTH STATUS
  // (Aged care assessments & functional status)
  // ═══════════════════════════════════════════════════════
  { icd11: '24A0', snomed: '386806002', title: 'Cognitive impairment', chapter: '24', category: 'Aged Care Priority', tags: ['mild cognitive impairment', 'MCI', 'memory', 'screening'] },
  { icd11: '24A1', snomed: '129839007', title: 'Risk of falls', chapter: '24', category: 'Aged Care Priority', tags: ['fall risk', 'balance', 'mobility', 'assessment', 'prevention'] },
  { icd11: '24A2', snomed: '272588001', title: 'Malnutrition risk', chapter: '24', category: 'Aged Care Priority', tags: ['weight loss', 'poor appetite', 'nutritional screening', 'frailty'] },
  { icd11: '24A3', snomed: '129588001', title: 'Frailty', chapter: '24', category: 'Aged Care Priority', tags: ['frail', 'elderly', 'sarcopenia', 'slow gait', 'grip strength'] },
  { icd11: '24A4', snomed: '160903007', title: 'Polypharmacy', chapter: '24', category: 'Aged Care Priority', tags: ['multiple medications', 'drug review', 'deprescribing'] },
  { icd11: '24A5', snomed: '26544005', title: 'Urinary incontinence (functional)', chapter: '24', category: 'Aged Care Priority', tags: ['bladder', 'continence', 'pad', 'elderly'] },
  { icd11: '24A6', snomed: '72042002', title: 'Faecal incontinence', chapter: '24', category: 'Aged Care Priority', tags: ['bowel', 'continence', 'elderly'] },
  { icd11: '24A7', snomed: '8943002', title: 'Weight loss (unintentional)', chapter: '24', category: 'Aged Care Priority', tags: ['unexplained', 'appetite', 'cancer screening', 'elderly'] },
  { icd11: '24A8', snomed: '162214009', title: 'Dysphagia', chapter: '24', category: 'Aged Care Priority', tags: ['swallowing difficulty', 'aspiration risk', 'speech pathology', 'thickened fluids'] },
  { icd11: '24A9', snomed: '397776000', title: 'Immobility', chapter: '24', category: 'Aged Care Priority', tags: ['bedbound', 'wheelchair', 'limited mobility', 'contracture'] },
  { icd11: '24B0', snomed: '422768004', title: 'Social isolation', chapter: '24', category: 'Aged Care Priority', tags: ['loneliness', 'elderly', 'wellbeing', 'mental health'] },
  { icd11: '24B1', snomed: '284530003', title: 'Carer burden/burnout', chapter: '24', category: 'Aged Care Priority', tags: ['caregiver stress', 'respite', 'support'] },

  // ═══════════════════════════════════════════════════════
  // ADDITIONAL AGED CARE PRIORITIES
  // ═══════════════════════════════════════════════════════
  { icd11: 'AC01', snomed: '26929004', title: "Alzheimer's disease", chapter: '06', category: 'Aged Care Priority', tags: ['dementia', 'memory loss', 'progressive', 'cognitive'] },
  { icd11: 'AC02', snomed: '49049000', title: "Parkinson's disease", chapter: '08', category: 'Aged Care Priority', tags: ['tremor', 'rigidity', 'mobility', 'dopamine'] },
  { icd11: 'AC03', snomed: '38341003', title: 'Hypertension', chapter: '11', category: 'Aged Care Priority', tags: ['high blood pressure', 'stroke risk', 'heart'] },
  { icd11: 'AC04', snomed: '44054006', title: 'Type 2 Diabetes', chapter: '05', category: 'Aged Care Priority', tags: ['blood sugar', 'insulin', 'HbA1c'] },
  { icd11: 'AC05', snomed: '84114007', title: 'Heart Failure', chapter: '11', category: 'Aged Care Priority', tags: ['CHF', 'oedema', 'breathless', 'diuretic'] },
  { icd11: 'AC06', snomed: '49436004', title: 'Atrial Fibrillation', chapter: '11', category: 'Aged Care Priority', tags: ['irregular heartbeat', 'stroke risk', 'warfarin'] },
  { icd11: 'AC07', snomed: '13645005', title: 'COPD', chapter: '12', category: 'Aged Care Priority', tags: ['emphysema', 'chronic bronchitis', 'breathless'] },
  { icd11: 'AC08', snomed: '709044004', title: 'Chronic Kidney Disease', chapter: '16', category: 'Aged Care Priority', tags: ['CKD', 'renal', 'dialysis'] },
  { icd11: 'AC09', snomed: '64859006', title: 'Osteoporosis', chapter: '15', category: 'Aged Care Priority', tags: ['fracture risk', 'bone density', 'calcium'] },
  { icd11: 'AC10', snomed: '396275006', title: 'Osteoarthritis', chapter: '15', category: 'Aged Care Priority', tags: ['joint pain', 'knee', 'hip', 'stiffness'] },
  { icd11: 'AC11', snomed: '230690007', title: 'Stroke History', chapter: '11', category: 'Aged Care Priority', tags: ['CVA', 'rehabilitation', 'hemiplegia'] },
  { icd11: 'AC12', snomed: '35489007', title: 'Depression', chapter: '06', category: 'Aged Care Priority', tags: ['low mood', 'elderly', 'antidepressant', 'sadness'] },
  { icd11: 'AC13', snomed: '15188001', title: 'Hearing Loss', chapter: '10', category: 'Aged Care Priority', tags: ['presbycusis', 'hearing aid', 'deaf'] },
  { icd11: 'AC14', snomed: '193570009', title: 'Cataract', chapter: '09', category: 'Aged Care Priority', tags: ['vision', 'lens', 'surgery'] },
  { icd11: 'AC15', snomed: '267718000', title: 'Macular Degeneration', chapter: '09', category: 'Aged Care Priority', tags: ['AMD', 'vision loss', 'central'] },
];

// ─── SEARCH FUNCTION ──────────────────────────────────

/**
 * High-performance local search across the full disease database.
 * Matches against title, ICD-11 code, SNOMED code, category, and tags.
 * Returns results ranked by relevance (title match first, then tags).
 *
 * @param {string} query - Search term (min 2 chars)
 * @param {object} opts - Optional filters
 * @param {string} opts.category - Restrict to a single category
 * @param {string} opts.chapter - Restrict to an ICD-11 chapter
 * @param {number} opts.limit - Max results (default 50)
 * @returns {Array} Matching diseases sorted by relevance
 */
export function searchDiseases(query, { category, chapter, limit = 50 } = {}) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  let pool = DISEASES;
  if (category) pool = pool.filter((d) => d.category === category);
  if (chapter) pool = pool.filter((d) => d.chapter === chapter);

  const scored = [];

  for (const disease of pool) {
    let score = 0;
    const titleLower = disease.title.toLowerCase();

    // Exact title match
    if (titleLower === q) {
      score = 100;
    }
    // Title starts with query
    else if (titleLower.startsWith(q)) {
      score = 80;
    }
    // Title contains query
    else if (titleLower.includes(q)) {
      score = 60;
    }
    // ICD-11 code match
    else if (disease.icd11.toLowerCase() === q) {
      score = 70;
    }
    // SNOMED code match
    else if (disease.snomed && disease.snomed === q) {
      score = 70;
    }
    // Category match
    else if (disease.category.toLowerCase().includes(q)) {
      score = 30;
    }
    // Tag match
    else {
      for (const tag of disease.tags) {
        if (tag.toLowerCase().includes(q)) {
          score = 40;
          break;
        }
      }
    }

    if (score > 0) {
      scored.push({ ...disease, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  return scored.slice(0, limit);
}

/**
 * Get all diseases in a specific category.
 * @param {string} category - Category name from CATEGORIES
 * @returns {Array}
 */
export function getDiseasesByCategory(category) {
  if (!category) return [];
  return DISEASES.filter((d) => d.category === category);
}

/**
 * Get all diseases in a specific ICD-11 chapter.
 * @param {string} chapter - Chapter code (01-26)
 * @returns {Array}
 */
export function getDiseasesByChapter(chapter) {
  if (!chapter) return [];
  return DISEASES.filter((d) => d.chapter === chapter);
}

/**
 * Get all aged care priority conditions.
 * @returns {Array}
 */
export function getAgedCarePriorities() {
  return DISEASES.filter((d) => d.category === 'Aged Care Priority');
}

/**
 * Lookup a single disease by ICD-11 or SNOMED code.
 * @param {string} code - ICD-11 or SNOMED code
 * @returns {object|null}
 */
export function lookupByCode(code) {
  if (!code) return null;
  const c = String(code).trim();
  return DISEASES.find((d) => d.icd11 === c || d.snomed === c) || null;
}
