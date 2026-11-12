

-- ----------------------------
-- Seed: Initial Verified Legal Updates & Research Notes
-- ----------------------------
INSERT INTO legal_updates (id, update_no, slug, category_id, authority_id, title, issue_date, status, published_at, created_by, is_permanent, view_count)
VALUES
  (1, 'MK-BUL-2026-001', 'cbdt-section-148a-faceless-reassessment-jurisdiction', (SELECT id FROM legal_categories WHERE slug = 'direct-tax'), (SELECT id FROM authorities WHERE code = 'CBDT'), 'CBDT Clarification on Issuance of Reassessment Notices Under Section 148A: Territorial vs Faceless Assessing Officers', '2026-11-04', 'published', NOW(), 1, TRUE, 428),
  (2, 'MK-BUL-2026-002', 'cbic-rule-28-corporate-guarantee-itc-valuation', (SELECT id FROM legal_categories WHERE slug = 'gst'), (SELECT id FROM authorities WHERE code = 'CBIC'), 'CBIC Circular on Valuation of Corporate Guarantees under Rule 28(2) of CGST Rules and Availability of Full ITC to Recipient', '2026-11-03', 'published', NOW(), 1, TRUE, 312),
  (3, 'MK-BUL-2026-003', 'nclat-full-bench-financial-debt-put-option-share-purchase', (SELECT id FROM legal_categories WHERE slug = 'ibc'), (SELECT id FROM authorities WHERE code = 'NCLAT'), 'NCLAT Full Bench Decision: Put-Option Obligations in Investment Agreements Do Not Constitute Financial Debt Under Section 5(8) of IBC', '2026-11-02', 'published', NOW(), 1, TRUE, 519),
  (4, 'MK-BUL-2026-004', 'sebi-circular-market-rumour-verification-top-250-listed-entities', (SELECT id FROM legal_categories WHERE slug = 'sebi-rbi'), (SELECT id FROM authorities WHERE code = 'SEBI'), 'SEBI Issues Master Operational Framework for Verification of Market Rumours under Regulation 30(11) of LODR Regulations', '2026-11-01', 'published', NOW(), 1, TRUE, 288)
ON CONFLICT (slug) DO NOTHING;

SELECT setval('legal_updates_id_seq', (SELECT COALESCE(MAX(id), 1) FROM legal_updates));

INSERT INTO research_notes (update_id, facts, legal_provisions, decision_development, conclusion_implications, original_references, ai_model, is_verified, verified_by, verified_at)
VALUES
  (1,
   '1. The Assessee had challenged the validity of a notice issued under Section 148 of the Income-tax Act, 1961, alleging lack of concurrent authority post-Faceless Scheme.
2. Divergent rulings arose across Bombay HC and Telangana HC regarding whether Section 151A makes faceless assessment mandatory to the exclusion of the JAO.
3. Central Board of Direct Taxes (CBDT) issued Master Instruction No. 04/2026 to harmonize field formations.',
   '• Income-tax Act, 1961: Section 148, Section 148A(b), Section 148A(d), Section 144B, Section 151A.
• Precedent: Hexaware Technologies Ltd. v. ACIT [2024] 464 ITR 430 (Bom); CIT v. Ashish Agarwal [2022] 444 ITR 1 (SC).',
   '• CBDT affirmed that Section 151A empowers schemes for faceless assessment, but does not divest Territorial JAO where information stems from physical search under Section 132.
• For non-search corporate returns, issuance of notices under Section 148 must strictly originate through automated allocation.',
   '• CA & Tax Professional Action: In all pending reassessment representations, verify whether Section 148 notice carries a valid Faceless Allocation Hash and DIN.
• If JAO issued notice without central charge notification, file preliminary objections under Section 151A.',
   '• CBDT Instruction No. 04/2026 [F. No. 225/118/2026-ITA-II].
• Official Gazette S.O. 1284(E).
• Source URL: https://incometaxindia.gov.in',
   'gemini-3.5-flash', TRUE, 'Manish Khandelwal, FCA', NOW()),
  (2,
   '1. Industry associations sought clarification on retrospective applicability of Rule 28(2) of CGST Rules, 2017.
2. Dispute centered on whether corporate guarantee provided by holding company constitutes continuous supply of service.
3. Field formations had initiated recovery proceedings alleging non-payment of 18% GST on 1% per annum of guaranteed amount.',
   '• Central Goods and Services Tax Act, 2017: Section 7(1)(c) read with Schedule I, Section 15(5), Section 16(1).
• CGST Rules, 2017: Rule 28(1), Rule 28(2).
• Circular No. 218/12/2026-GST.',
   '• CBIC clarified that where recipient subsidiary is eligible for full Input Tax Credit under Section 16, invoice value is deemed open market value.
• The 1% per annum valuation applies strictly when actual monetary consideration is exchanged.',
   '• CFO & GST Practitioner Action: Review inter-company credit support agreements.
• For group companies with 100% taxable outward supplies, claim full ITC in GSTR-3B.
• For pending DRC-01 notices, submit reference to this circular for immediate drop of proceedings.',
   '• CBIC Circular No. 218/12/2026-GST [CBIC-190354/36/2026-TO(TRU-II)].
• Source URL: https://cbic.gov.in',
   'gemini-3.5-flash', TRUE, 'Manish Khandelwal, FCA', NOW()),
  (3,
   '1. PE investor entered into SSHA with corporate debtor containing assured exit put-option guaranteeing 15% IRR.
2. Upon default, investor invoked Section 7 of IBC claiming default of Rs. 84 Crores was financial debt.
3. Adjudicating Authority admitted CIRP; suspended director approached NCLAT Full Bench.',
   '• Insolvency and Bankruptcy Code, 2016: Section 5(7), Section 5(8), Section 7.
• Precedents: Phoenix ARC Pvt Ltd v. Spade Financial [2021] 3 SCC 475; Pioneer Urban Land v. Union of India [2019] 8 SCC 416.',
   '• NCLAT Full Bench held that investment in equity carrying put-option cannot be elevated to Financial Debt under Section 5(8) of IBC.
• An equity shareholder assumes equity risks; assured exit represents contractual right, not disbursement against time value of money.',
   '• Insolvency Professionals & Legal Advisors: Resolution Professionals must reject Form C submissions anchored purely on put-option defaults.
• PE/VC Funds: Redraft investment structures using Convertible Debentures (CCD) with explicit debt covenants.',
   '• Comp App (AT) (Ins) No. 482 of 2026.
• Neutral Citation: 2026:NCLAT:DEL:482.
• Source URL: https://nclat.nic.in',
   'gemini-3.5-flash', TRUE, 'Manish Khandelwal, FCA', NOW()),
  (4,
   '1. SEBI introduced mandatory obligations on top 100 and top 250 listed entities to clarify market rumours within 24 hours of material price movement.
2. Listed corporations highlighted bottlenecks concerning premature disclosure of sensitive M&A negotiations.
3. SEBI released operational circular delineating material price movement thresholds.',
   '• SEBI (Listing Obligations and Disclosure Requirements) Regulations, 2015: Regulation 30(11), Regulation 30(11A).
• SEBI Circular SEBI/HO/CFD/CFD-PoD-2/P/CIR/2026/18.',
   '• Listed entities must verify rumours only when stock price movement exceeds benchmark (5% in Nifty 50) within 2-trading-day rolling window.
• Preliminary exploratory talks that have not crystallized are exempt.',
   '• CS & Compliance Officers: Establish internal Rumour Response Committee consisting of CS, CFO, and IR Head.
• Advise promoters that leaking unverified transaction rumors invites Section 11B SEBI inquiries.',
   '• SEBI Master Circular No. SEBI/HO/CFD/CFD-PoD-2/P/CIR/2026/18.
• Source URL: https://sebi.gov.in',
   'gemini-3.5-flash', TRUE, 'Manish Khandelwal, FCA', NOW())
ON CONFLICT (update_id) DO NOTHING;
