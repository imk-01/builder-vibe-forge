/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * User types for authentication
 */
export interface User {
  id: number;
  username: string;
  email: string;
  role: "admin" | "ketua" | "ppl" | "pml";
  name: string;
}

/**
 * PPL (Petugas Pengumpul Lainnya) types
 */
export interface PPL {
  id?: number;
  namaPPL: string;
  namaPML: string;
  tahap:
    | "persiapan"
    | "pengumpulan-data"
    | "pengolahan-analisis"
    | "diseminasi-evaluasi";
  bebanKerja: string;
  satuanBebanKerja: string;
  hargaSatuan: string;
  besaranHonor: string;
  progressOpen?: number;
  progressSubmit?: number;
  progressDiperiksa?: number;
  progressApproved?: number;
}

/**
 * Document types for different phases
 */
export interface Dokumen {
  id?: number;
  nama: string;
  tipe:
    | "persiapan"
    | "pengumpulan-data"
    | "pengolahan-analisis"
    | "diseminasi-evaluasi";
  isWajib: boolean;
  status: "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected";
  filePath?: string;
  uploadedAt?: string;
  uploadedBy?: string;
}

/**
 * Main Activity/Kegiatan type
 */
export interface Kegiatan {
  id: number;
  namaKegiatan: string;
  namaKetua: string;
  deskripsiKegiatan?: string;
  status:
    | "Persiapan"
    | "Pengumpulan Data"
    | "Pengolahan & Analisis"
    | "Diseminasi & Evaluasi"
    | "Selesai";
  progressKeseluruhan?: number;

  // Schedule dates for each phase
  tanggalMulaiPersiapan?: string;
  tanggalSelesaiPersiapan?: string;
  tanggalMulaiPengumpulanData?: string;
  tanggalSelesaiPengumpulanData?: string;
  tanggalMulaiPengolahanAnalisis?: string;
  tanggalSelesaiPengolahanAnalisis?: string;
  tanggalMulaiDiseminasiEvaluasi?: string;
  tanggalSelesaiDiseminasiEvaluasi?: string;

  // Related data
  ppl: PPL[];
  dokumen: Dokumen[];

  // Metadata
  lastUpdated: string;
  lastUpdatedBy?: string;
  createdAt?: string;
  createdBy?: string;
}

/**
 * API Response types
 */
export interface KegiatanListResponse {
  data: Kegiatan[];
  total: number;
}

export interface KegiatanDetailResponse {
  data: Kegiatan;
}

export interface ProgressUpdateRequest {
  open: number;
  submit: number;
  diperiksa: number;
  approved: number;
  username: string;
}
