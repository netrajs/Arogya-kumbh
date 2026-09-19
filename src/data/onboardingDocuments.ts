// Default document checklist HR is expected to collect per role. This is a
// checklist only (name + later a `received` toggle in the onboarding form)
// — the app has no file-upload/storage capability, so no actual files are
// stored anywhere.
export const ONBOARDING_DOCUMENTS: Record<'doctor' | 'nurse' | 'receptionist', string[]> = {
  doctor: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Medical degree certificate (MBBS/MD or equivalent)',
    'Medical Council registration certificate',
    'Previous employment / experience certificate',
  ],
  nurse: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Nursing diploma / degree certificate',
    'Nursing Council registration certificate',
    'Previous employment / experience certificate',
  ],
  receptionist: [
    'Government ID proof (Aadhaar / PAN / Passport)',
    'Address proof',
    'Educational certificate (highest qualification)',
    'Previous employment reference (if applicable)',
  ],
}
