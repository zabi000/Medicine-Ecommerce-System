// MEDIX - AI Doctor Prescription & Medicine Formula Recommender Client Script

class MedixAIPrescription {
  constructor(options = {}) {
    this.containerId = options.containerId || 'ai-prescription-section';
    this.currentImageBase64 = null;
    this.currentImageMime = null;
    this.lastConsultData = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.checkCartStorage();
  }

  checkCartStorage() {
    this.updateCartBadge();
  }

  updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cart-count');
    if (badge) {
      badge.textContent = totalQty;
    }
  }

  addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        formula: product.formula || '',
        category: product.category || 'prescription',
        image_url: product.image_url || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
        quantity: 1
      });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    this.updateCartBadge();
    this.showToast(`✅ Added ${product.name} to Cart!`);
  }

  showToast(message, isError = false) {
    let container = document.getElementById('medix-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'medix-toast-container';
      container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background:${isError ? '#DC2626' : '#059669'};
      color:white;
      padding:12px 20px;
      border-radius:12px;
      box-shadow:0 10px 25px rgba(0,0,0,0.2);
      font-weight:600;
      font-size:0.9rem;
      pointer-events:auto;
      display:flex;
      align-items:center;
      gap:8px;
      animation:slideInToast 0.3s ease;
    `;
    toast.innerHTML = `<i class="bi bi-${isError ? 'exclamation-circle' : 'check-circle-fill'}"></i> ${message}`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  bindEvents() {
    const fileInput = document.getElementById('prescriptionFileInput');
    const dropZone = document.getElementById('prescriptionDropZone');
    const imagePreviewContainer = document.getElementById('prescriptionImagePreviewContainer');
    const imagePreview = document.getElementById('prescriptionImagePreview');
    const removeImageBtn = document.getElementById('removePrescriptionImage');
    const consultBtn = document.getElementById('consultAIBtn');
    const textInput = document.getElementById('prescriptionTextInput');

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleImageFile(file);
      });
    }

    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-danger');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-danger');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-danger');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleImageFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (removeImageBtn) {
      removeImageBtn.addEventListener('click', () => {
        this.currentImageBase64 = null;
        this.currentImageMime = null;
        if (fileInput) fileInput.value = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        if (dropZone) dropZone.style.display = 'block';
      });
    }

    // Formula chips quick buttons
    document.querySelectorAll('.formula-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const formula = btn.getAttribute('data-formula') || btn.textContent.trim();
        if (textInput) {
          textInput.value = formula;
          textInput.focus();
        }
      });
    });

    if (consultBtn) {
      consultBtn.addEventListener('click', () => this.runConsultation());
    }
  }

  handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      this.showToast('Please upload an image file (JPG, PNG, WEBP)', true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentImageBase64 = e.target.result;
      this.currentImageMime = file.type;
      
      const imagePreview = document.getElementById('prescriptionImagePreview');
      const imagePreviewContainer = document.getElementById('prescriptionImagePreviewContainer');
      const dropZone = document.getElementById('prescriptionDropZone');

      if (imagePreview) imagePreview.src = this.currentImageBase64;
      if (imagePreviewContainer) imagePreviewContainer.style.display = 'block';
      if (dropZone) dropZone.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  async runConsultation() {
    const textInput = document.getElementById('prescriptionTextInput');
    const ageInput = document.getElementById('patientAgeInput');
    const notesInput = document.getElementById('patientNotesInput');
    const resultsContainer = document.getElementById('aiConsultResultsContainer');
    const loadingState = document.getElementById('aiConsultLoading');
    const consultBtn = document.getElementById('consultAIBtn');

    const prescriptionText = textInput ? textInput.value.trim() : '';
    const patientAge = ageInput ? ageInput.value.trim() : '';
    const patientNotes = notesInput ? notesInput.value.trim() : '';

    if (!prescriptionText && !this.currentImageBase64) {
      this.showToast('Please type prescription notes / medicine formula or upload a prescription image', true);
      if (textInput) textInput.focus();
      return;
    }

    // Loading UI
    if (loadingState) loadingState.style.display = 'block';
    if (resultsContainer) resultsContainer.style.display = 'none';
    if (consultBtn) consultBtn.disabled = true;

    try {
      const response = await fetch('/api/ai/prescription-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionText,
          patientAge,
          patientNotes,
          imageBase64: this.currentImageBase64,
          mimeType: this.currentImageMime
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to complete consultation');
      }

      this.lastConsultData = data;
      this.renderResults(data);
    } catch (err) {
      console.error(err);
      this.showToast(err.message || 'Error communicating with AI Clinical Engine', true);
    } finally {
      if (loadingState) loadingState.style.display = 'none';
      if (consultBtn) consultBtn.disabled = false;
    }
  }

  renderResults(data) {
    const resultsContainer = document.getElementById('aiConsultResultsContainer');
    if (!resultsContainer) return;

    this.lastConsultData = data;

    let html = `
      <div class="card border-0 shadow-lg rounded-4 overflow-hidden mb-4" style="background:#ffffff; border: 1.5px solid #F1F5F9;">
        <!-- Header Banner -->
        <div class="p-4" style="background: linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%); color: white;">
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-white text-danger fw-bold px-3 py-1 rounded-pill" style="font-size:0.8rem;">
                  <i class="bi bi-robot"></i> CLINICAL AI REPORT
                </span>
                ${data.doctorPrescriptionRequired ? 
                  `<span class="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill" style="font-size:0.8rem;">
                    <i class="bi bi-file-earmark-medical"></i> PRESCRIPTION REQUIRED
                   </span>` : 
                  `<span class="badge bg-success fw-bold px-3 py-1 rounded-pill" style="font-size:0.8rem;">
                    <i class="bi bi-check-circle"></i> OVER-THE-COUNTER (OTC)
                   </span>`}
              </div>
              <h4 class="fw-bold mb-1 text-white">${data.conditionDiagnosis || 'Targeted Clinical Formulation'}</h4>
              <p class="mb-0 text-white-50" style="font-size:0.95rem;">${data.prescriptionSummary}</p>
            </div>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-outline-light btn-sm rounded-pill px-3 shadow-sm fw-semibold" onclick="window.medixAI.openPrintModal()">
                <i class="bi bi-printer me-1"></i> Print / PDF Report
              </button>
              <button class="btn btn-light btn-sm rounded-pill px-3 shadow-sm fw-bold text-danger" onclick="window.medixAI.downloadReport()">
                <i class="bi bi-download me-1"></i> Download
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-4">
          <!-- Active Formula Breakdown -->
          <div class="mb-4">
            <h5 class="fw-bold text-dark d-flex align-items-center gap-2 mb-3">
              <i class="bi bi-capsule text-danger"></i> Active Chemical Formulas & Salts
            </h5>
            <div class="row g-3">
              ${(data.formulaBreakdown || []).map(f => `
                <div class="col-md-6">
                  <div class="p-3 rounded-3 h-100" style="background: #FFF5F5; border: 1px solid #FECACA;">
                    <div class="fw-bold text-danger fs-6 mb-1">${f.saltName}</div>
                    <div class="badge bg-danger text-white mb-2" style="font-size:0.75rem;">${f.clinicalRole || 'Active API'}</div>
                    <p class="text-secondary small mb-2">${f.mechanismOfAction}</p>
                    <div class="small fw-semibold text-dark"><i class="bi bi-clock me-1 text-danger"></i> Standard Dosage: <span class="text-muted fw-normal">${f.standardDosage}</span></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Instructions & Warnings Grid -->
          <div class="row g-3 mb-4">
            <div class="col-md-6">
              <div class="p-3 rounded-3 h-100" style="background:#F0FDF4; border:1px solid #BBF7D0;">
                <h6 class="fw-bold text-success mb-2"><i class="bi bi-check2-circle me-1"></i> Patient Usage Guidelines</h6>
                <ul class="mb-0 ps-3 small text-secondary" style="line-height:1.7;">
                  ${(data.instructionsForPatient || []).map(inst => `<li>${inst}</li>`).join('')}
                </ul>
              </div>
            </div>
            <div class="col-md-6">
              <div class="p-3 rounded-3 h-100" style="background:#FEF2F2; border:1px solid #FECACA;">
                <h6 class="fw-bold text-danger mb-2"><i class="bi bi-exclamation-triangle me-1"></i> Safety Warnings & Precautions</h6>
                <ul class="mb-0 ps-3 small text-secondary" style="line-height:1.7;">
                  ${(data.safetyWarnings || []).map(warn => `<li>${warn}</li>`).join('')}
                  ${(data.precautionsAndInteractions || []).map(p => `<li>${p}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>

          <!-- Recommended Medix Catalog Products -->
          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-3">
              <h5 class="fw-bold text-dark mb-0">
                <i class="bi bi-bag-check-fill text-danger me-1"></i> Recommended Medicines In Stock
              </h5>
              <span class="text-muted small">Matched from MEDIX verified store catalog</span>
            </div>

            <div class="row g-3">
              ${(data.recommendedMedicines || []).map(med => `
                <div class="col-md-6 col-lg-4">
                  <div class="card h-100 border-0 shadow-sm rounded-4 p-3 d-flex flex-column justify-content-between" style="border: 1.5px solid #F1F5F9 !important; background: #fafafa;">
                    <div>
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${med.matchType === 'exact_formula' ? 'bg-success' : 'bg-primary'} rounded-pill" style="font-size:0.75rem;">
                          ${med.matchType === 'exact_formula' ? 'Exact Formula Match' : 'Doctor Brand Match'}
                        </span>
                        <span class="fw-bold text-danger fs-5">PKR ${Number(med.price).toLocaleString()}</span>
                      </div>
                      <h6 class="fw-bold text-dark mb-1">${med.name}</h6>
                      <div class="text-muted small mb-2"><i class="bi bi-flask me-1 text-danger"></i>${med.formula}</div>
                      <div class="p-2 rounded-2 mb-3" style="background:white; border: 1px dashed #E2E8F0; font-size:0.8rem; color:#475569;">
                        <strong>Dosage:</strong> ${med.dosageAdvice}
                      </div>
                    </div>
                    <button class="btn btn-danger w-100 rounded-pill fw-bold py-2 add-to-cart-ai-btn" 
                            data-product-id="${med.id}"
                            data-product-name="${med.name.replace(/"/g, '&quot;')}"
                            data-product-price="${med.price}"
                            data-product-formula="${(med.formula || '').replace(/"/g, '&quot;')}">
                      <i class="bi bi-cart-plus me-1"></i> Add to Cart
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Disclaimer Note -->
          <div class="alert alert-light border small text-muted mb-0 rounded-3 mt-4">
            <i class="bi bi-shield-check text-danger me-1"></i>
            <strong>Medical Notice:</strong> ${data.medicalDisclaimer}
          </div>
        </div>
      </div>
    `;

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';

    // Bind Add to Cart buttons inside results
    resultsContainer.querySelectorAll('.add-to-cart-ai-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = {
          id: parseInt(btn.getAttribute('data-product-id')),
          name: btn.getAttribute('data-product-name'),
          price: parseFloat(btn.getAttribute('data-product-price')),
          formula: btn.getAttribute('data-product-formula')
        };
        this.addToCart(product);
      });
    });

    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ============================================================
  // PRINT & EXPORT ANALYSIS REPORT ENGINE
  // ============================================================

  generateReportHTML(data) {
    if (!data) data = this.lastConsultData;
    if (!data) return '<p>No prescription analysis data available.</p>';

    const today = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MEDIX - Clinical Prescription Report</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; margin: 0; padding: 20px; background: #fff; }
    .rx-header { border-bottom: 3px double #b91c1c; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
    .brand-title { font-size: 26px; font-weight: 900; color: #b91c1c; letter-spacing: 1px; margin: 0; }
    .brand-sub { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; }
    .meta-box { text-align: right; font-size: 12px; color: #475569; }
    .meta-box strong { color: #0f172a; }
    .rx-symbol { font-size: 32px; font-weight: 900; color: #b91c1c; font-family: 'Times New Roman', serif; }
    .section-title { font-size: 14px; font-weight: 700; color: #b91c1c; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .formula-table, .medicine-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 13px; }
    .formula-table th, .medicine-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-weight: 700; color: #334155; }
    .formula-table td, .medicine-table td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
    .badge-status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
    .badge-rx { background: #fef3c7; color: #92400e; }
    .badge-otc { background: #dcfce7; color: #166534; }
    .guidelines-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 15px; }
    .guidelines-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #334155; }
    .guidelines-box li { margin-bottom: 4px; }
    .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #dc2626; border-radius: 4px; padding: 12px; margin-bottom: 15px; }
    .warning-box ul { margin: 0; padding-left: 20px; font-size: 13px; color: #991b1b; }
    .footer-seal { margin-top: 35px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 11px; color: #64748b; }
    .seal-box { text-align: center; border: 2px dashed #cbd5e1; padding: 10px 20px; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="rx-header">
    <div>
      <h1 class="brand-title">MEDIX PHARMACY</h1>
      <div class="brand-sub">Clinical AI Pharmacological Analysis & Prescription Verification</div>
    </div>
    <div class="meta-box">
      <div>Report Ref: <strong>MEDIX-RX-${Date.now().toString().slice(-6)}</strong></div>
      <div>Date & Time: <strong>${today}</strong></div>
      <div>Status: <span class="badge-status ${data.doctorPrescriptionRequired ? 'badge-rx' : 'badge-otc'}">${data.doctorPrescriptionRequired ? 'PRESCRIPTION REQUIRED' : 'OVER-THE-COUNTER (OTC)'}</span></div>
    </div>
  </div>

  <div style="margin-bottom: 15px;">
    <span class="rx-symbol">℞</span>
    <strong style="font-size: 18px; margin-left: 8px;">Target Condition: ${data.conditionDiagnosis || 'Clinical Consultation'}</strong>
    <p style="margin: 4px 0 0; color: #475569; font-size: 13px;">${data.prescriptionSummary}</p>
  </div>

  <div class="section-title">1. Active Chemical Salts & Formula Mechanism</div>
  <table class="formula-table">
    <thead>
      <tr>
        <th style="width: 28%;">Active Salt (API)</th>
        <th style="width: 25%;">Pharmacological Class</th>
        <th>Mechanism of Action & Standard Regimen</th>
      </tr>
    </thead>
    <tbody>
      ${(data.formulaBreakdown || []).map(f => `
        <tr>
          <td><strong style="color:#b91c1c;">${f.saltName}</strong></td>
          <td>${f.clinicalRole || 'Therapeutic Active Ingredient'}</td>
          <td>
            <div>${f.mechanismOfAction}</div>
            <div style="margin-top: 4px; font-size: 11px; color: #64748b;"><strong>Standard Dosage:</strong> ${f.standardDosage}</div>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">2. Patient Instructions & Dosage Regimen</div>
  <div class="guidelines-box">
    <ul>
      ${(data.instructionsForPatient || []).map(i => `<li>${i}</li>`).join('')}
    </ul>
  </div>

  <div class="section-title">3. Safety Precautions & Contraindications</div>
  <div class="warning-box">
    <ul>
      ${(data.safetyWarnings || []).map(w => `<li><strong>Warning:</strong> ${w}</li>`).join('')}
      ${(data.precautionsAndInteractions || []).map(p => `<li><strong>Interaction Notice:</strong> ${p}</li>`).join('')}
    </ul>
  </div>

  <div class="section-title">4. Matched Medicines in Store Inventory</div>
  <table class="medicine-table">
    <thead>
      <tr>
        <th>Medicine Brand Name</th>
        <th>Active Chemical Formula</th>
        <th>Suggested Dose</th>
        <th>Catalog Price</th>
      </tr>
    </thead>
    <tbody>
      ${(data.recommendedMedicines || []).map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td style="color:#b91c1c;">${m.formula}</td>
          <td>${m.dosageAdvice}</td>
          <td><strong>PKR ${Number(m.price).toLocaleString()}</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-seal">
    <div style="max-width: 65%;">
      <strong>Clinical Disclaimer:</strong> ${data.medicalDisclaimer}
      <div style="margin-top: 4px;">Medix E-Commerce Pharmacy &bull; Support: support@medix.com &bull; Certified Authentic Stock</div>
    </div>
    <div class="seal-box">
      <div style="font-weight: 800; color: #b91c1c; font-size: 12px;">MEDIX VERIFIED</div>
      <div style="font-size: 10px; color: #64748b;">Clinical AI Validated</div>
    </div>
  </div>
</body>
</html>
    `;
  }

  openPrintModal() {
    const data = this.lastConsultData;
    if (!data) {
      this.showToast('Please run prescription analysis first', true);
      return;
    }

    let modalEl = document.getElementById('medixPrintModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'medixPrintModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      document.body.appendChild(modalEl);
    }

    const reportHtml = this.generateReportHTML(data);

    modalEl.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content border-0 rounded-4 shadow-lg overflow-hidden">
          <div class="modal-header bg-danger text-white py-3">
            <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
              <i class="bi bi-file-earmark-medical"></i> Clinical Prescription Report
            </h5>
            <div class="d-flex align-items-center gap-2 ms-auto">
              <button type="button" class="btn btn-light btn-sm rounded-pill fw-bold" onclick="window.medixAI.directPrint()">
                <i class="bi bi-printer me-1"></i> Print / Save as PDF
              </button>
              <button type="button" class="btn btn-outline-light btn-sm rounded-pill" onclick="window.medixAI.downloadReport()">
                <i class="bi bi-download me-1"></i> Download File
              </button>
              <button type="button" class="btn btn-outline-light btn-sm rounded-pill" onclick="window.medixAI.copyReportText()">
                <i class="bi bi-clipboard me-1"></i> Copy Text
              </button>
              <button type="button" class="btn-close btn-close-white ms-2" data-bs-dismiss="modal"></button>
            </div>
          </div>
          <div class="modal-body p-0 bg-light">
            <div class="p-3" style="max-height: 75vh; overflow-y: auto;">
              <div id="printablePrescriptionDoc" class="bg-white p-4 rounded-3 shadow-sm border mx-auto" style="max-width: 750px;">
                ${reportHtml}
              </div>
            </div>
          </div>
          <div class="modal-footer bg-white border-top d-flex justify-content-between">
            <small class="text-muted"><i class="bi bi-info-circle me-1"></i> You can print directly or save as PDF via your browser's Print window.</small>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-secondary btn-sm rounded-pill px-4" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn btn-danger btn-sm rounded-pill px-4 fw-bold" onclick="window.medixAI.directPrint()">
                <i class="bi bi-printer me-1"></i> Print Now
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();
  }

  directPrint() {
    const data = this.lastConsultData;
    if (!data) return;

    const reportHtml = this.generateReportHTML(data);

    // Create an isolated hidden iframe for printing
    let printFrame = document.getElementById('medixPrintIframe');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'medixPrintIframe';
      printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden;';
      document.body.appendChild(printFrame);
    }

    try {
      const doc = printFrame.contentWindow.document;
      doc.open();
      doc.write(reportHtml);
      doc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (iframePrintErr) {
          console.warn('Iframe print intercepted, trying window.print()...', iframePrintErr);
          window.print();
        }
      }, 350);
    } catch (e) {
      console.warn('Sandbox blocked iframe print, invoking window.print()...', e);
      window.print();
    }
  }

  downloadReport() {
    const data = this.lastConsultData;
    if (!data) {
      this.showToast('Please run prescription analysis first', true);
      return;
    }

    const reportHtml = this.generateReportHTML(data);
    const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MEDIX_Prescription_Report_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast('✅ Prescription report downloaded! Open to print or save as PDF.');
  }

  copyReportText() {
    const data = this.lastConsultData;
    if (!data) return;

    let text = `=========================================\n`;
    text += `MEDIX CLINICAL PRESCRIPTION REPORT\n`;
    text += `=========================================\n`;
    text += `Target Diagnosis: ${data.conditionDiagnosis || 'Clinical Inquiry'}\n`;
    text += `Summary: ${data.prescriptionSummary}\n`;
    text += `Prescription Status: ${data.doctorPrescriptionRequired ? 'PRESCRIPTION REQUIRED' : 'OTC'}\n\n`;

    text += `[ACTIVE FORMULA SALTS]\n`;
    (data.formulaBreakdown || []).forEach(f => {
      text += `- ${f.saltName} (${f.clinicalRole || 'API'}): ${f.mechanismOfAction}\n  Standard Dosage: ${f.standardDosage}\n`;
    });

    text += `\n[DOSAGE INSTRUCTIONS]\n`;
    (data.instructionsForPatient || []).forEach(i => {
      text += `- ${i}\n`;
    });

    text += `\n[SAFETY WARNINGS & INTERACTIONS]\n`;
    (data.safetyWarnings || []).forEach(w => {
      text += `- WARNING: ${w}\n`;
    });
    (data.precautionsAndInteractions || []).forEach(p => {
      text += `- PRECAUTION: ${p}\n`;
    });

    text += `\n[RECOMMENDED MEDICINES IN STOCK]\n`;
    (data.recommendedMedicines || []).forEach(m => {
      text += `- ${m.name} [Formula: ${m.formula}] - PKR ${m.price} (${m.dosageAdvice})\n`;
    });

    text += `\nMedical Disclaimer: ${data.medicalDisclaimer}\n`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => this.showToast('✅ Report summary copied to clipboard!'))
        .catch(() => this.fallbackCopyText(text));
    } else {
      this.fallbackCopyText(text);
    }
  }

  fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.showToast('✅ Report summary copied to clipboard!');
    } catch {
      this.showToast('Failed to copy', true);
    }
    document.body.removeChild(textarea);
  }
}

// Global instance
window.medixAI = new MedixAIPrescription();
