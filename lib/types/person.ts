export interface PersonKYC {
  id: string | null;       // null = CompanyDirector only, KYC not yet created in csi_persons
  companyId: string;
  // Fields from CompanyDirector merge
  _directorId?: string;   // CompanyDirector.id (source)
  _source?: string;       // "company_director" | "csi_persons"
  isActive?: boolean;     // CompanyDirector.isActive
  appointedAt?: string;   // CompanyDirector.appointedAt
  category?: string;      // CompanyDirector.category (raw, before mapped to directorCategory)
  kycComplete?: boolean;  // pre-computed flag
  name: string;
  fatherName?: string;
  dateOfBirth?: string;
  mobile?: string;
  email?: string;
  presentAddress?: string;
  permanentAddress?: string;
  aadhaarNo?: string;
  panNo?: string;
  accountNo?: string;
  ifscCode?: string;
  bankName?: string;
  nationality?: string;
  occupation?: string;
  occupationCategory?: string;
  din?: string;
  dateOfJoining?: string;
  designation?: string;
  directorCategory?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeAddress?: string;
  dematDpId?: string;
  dematClientId?: string;
  isDirector: boolean;
  isShareholder: boolean;
  createdAt: string;
  // joined
  shareholders?: ShareholderRecord[];
}

export interface ShareholderRecord {
  id: string;
  personId: string;
  folioNumber?: string;
  certificateNumber?: string;
  distinctiveFrom?: number;
  distinctiveTo?: number;
  numberOfShares?: number;
  shareType?: string;
  dateOfAcquisition?: string;
  nomineeName?: string;
  nomineeRelation?: string;
}
