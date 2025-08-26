import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import SuccessModal from "@/components/SuccessModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import AlertModal from "@/components/AlertModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Edit, 
  RefreshCw, 
  Trash2, 
  FileCheck, 
  Users, 
  Activity, 
  FileText, 
  AlertTriangle, 
  Search, 
  Filter, 
  BarChart, 
  BookOpen, 
  Send, 
  CheckSquare, 
  TrendingUp,
  Calendar,
  Clock,
  User,
  Star
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Kegiatan, PPL, Dokumen } from "@shared/api";
import { cn } from "@/lib/utils";
import { format, isPast, parseISO, isValid } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { useAuth } from "@/contexts/AuthContext";

// --- Tipe Data Frontend ---
type PPLWithProgress = PPL & {
  progressOpen: number;
  progressSubmit: number;
  progressDiperiksa: number;
  progressApproved: number;
};

type KegiatanWithDynamicStatus = Kegiatan & {
  dynamicStatus: {
    status: Kegiatan['status'];
    color: string;
    warnings: string[];
  }
};

// --- Mock Data ---
const mockActivities: Kegiatan[] = [
  {
    id: 1,
    namaKegiatan: "Survei Sosial Ekonomi Nasional (SUSENAS) 2024",
    namaKetua: "Dr. Ahmad Pratama",
    deskripsiKegiatan: "Survei untuk mengumpulkan data sosial ekonomi rumah tangga di seluruh Indonesia sebagai dasar perencanaan pembangunan nasional.",
    status: "Pengumpulan Data",
    progressKeseluruhan: 65,
    tanggalMulaiPersiapan: "2024-01-15",
    tanggalSelesaiPersiapan: "2024-02-28",
    tanggalMulaiPengumpulanData: "2024-03-01",
    tanggalSelesaiPengumpulanData: "2024-05-31",
    tanggalMulaiPengolahanAnalisis: "2024-06-01",
    tanggalSelesaiPengolahanAnalisis: "2024-08-31",
    tanggalMulaiDiseminasiEvaluasi: "2024-09-01",
    tanggalSelesaiDiseminasiEvaluasi: "2024-10-31",
    ppl: [
      {
        id: 1,
        namaPPL: "Siti Rahayu",
        namaPML: "Budi Santoso",
        tahap: "pengumpulan-data",
        bebanKerja: "150",
        satuanBebanKerja: "KRT",
        hargaSatuan: "25000",
        besaranHonor: "3750000",
        progressOpen: 45,
        progressSubmit: 30,
        progressDiperiksa: 25,
        progressApproved: 20
      },
      {
        id: 2,
        namaPPL: "Andi Wijaya",
        namaPML: "Sari Indah",
        tahap: "pengumpulan-data",
        bebanKerja: "120",
        satuanBebanKerja: "KRT",
        hargaSatuan: "25000",
        besaranHonor: "3000000",
        progressOpen: 60,
        progressSubmit: 40,
        progressDiperiksa: 35,
        progressApproved: 30
      }
    ],
    dokumen: [],
    lastUpdated: "2024-01-20T10:30:00Z",
    lastUpdatedBy: "Ahmad Pratama",
    createdAt: "2024-01-15T09:00:00Z"
  },
  {
    id: 2,
    namaKegiatan: "Sensus Pertanian 2024",
    namaKetua: "Prof. Maria Sari",
    deskripsiKegiatan: "Sensus untuk mengumpulkan data komprehensif tentang struktur pertanian dan perkebunan di Indonesia.",
    status: "Persiapan",
    progressKeseluruhan: 25,
    tanggalMulaiPersiapan: "2024-02-01",
    tanggalSelesaiPersiapan: "2024-04-30",
    tanggalMulaiPengumpulanData: "2024-05-01",
    tanggalSelesaiPengumpulanData: "2024-07-31",
    tanggalMulaiPengolahanAnalisis: "2024-08-01",
    tanggalSelesaiPengolahanAnalisis: "2024-10-31",
    tanggalMulaiDiseminasiEvaluasi: "2024-11-01",
    tanggalSelesaiDiseminasiEvaluasi: "2024-12-31",
    ppl: [
      {
        id: 3,
        namaPPL: "Rizki Pratama",
        namaPML: "Dewi Lestari",
        tahap: "persiapan",
        bebanKerja: "200",
        satuanBebanKerja: "Petani",
        hargaSatuan: "20000",
        besaranHonor: "4000000",
        progressOpen: 80,
        progressSubmit: 15,
        progressDiperiksa: 10,
        progressApproved: 5
      }
    ],
    dokumen: [],
    lastUpdated: "2024-01-18T14:15:00Z",
    lastUpdatedBy: "Maria Sari",
    createdAt: "2024-02-01T08:00:00Z"
  },
  {
    id: 3,
    namaKegiatan: "Survei Angkatan Kerja Nasional (SAKERNAS) 2024",
    namaKetua: "Dr. Bambang Sutrisno",
    deskripsiKegiatan: "Survei ketenagakerjaan untuk mendapatkan data tentang kondisi ketenagakerjaan di Indonesia.",
    status: "Diseminasi & Evaluasi",
    progressKeseluruhan: 90,
    tanggalMulaiPersiapan: "2023-11-01",
    tanggalSelesaiPersiapan: "2023-12-31",
    tanggalMulaiPengumpulanData: "2024-01-01",
    tanggalSelesaiPengumpulanData: "2024-02-29",
    tanggalMulaiPengolahanAnalisis: "2024-03-01",
    tanggalSelesaiPengolahanAnalisis: "2024-04-30",
    tanggalMulaiDiseminasiEvaluasi: "2024-05-01",
    tanggalSelesaiDiseminasiEvaluasi: "2024-06-30",
    ppl: [
      {
        id: 4,
        namaPPL: "Lina Oktavia",
        namaPML: "Hadi Purnomo",
        tahap: "diseminasi-evaluasi",
        bebanKerja: "100",
        satuanBebanKerja: "Responden",
        hargaSatuan: "30000",
        besaranHonor: "3000000",
        progressOpen: 5,
        progressSubmit: 10,
        progressDiperiksa: 15,
        progressApproved: 70
      }
    ],
    dokumen: [],
    lastUpdated: "2024-01-19T16:45:00Z",
    lastUpdatedBy: "Bambang Sutrisno",
    createdAt: "2023-11-01T09:00:00Z"
  }
];

// --- API Functions ---
const fetchActivities = async (): Promise<Kegiatan[]> => {
  // Mock API call with delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockActivities;
};

const deleteActivity = async (id: number): Promise<void> => {
    // Mock delete
    await new Promise(resolve => setTimeout(resolve, 500));
};

const updatePplProgress = async ({ pplId, progressData }: { pplId: number; progressData: any }) => {
    // Mock update
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
};

// --- Helper Functions ---
const calculateActivityStatus = (kegiatan: Kegiatan): KegiatanWithDynamicStatus['dynamicStatus'] => {
    const warnings: string[] = [];
    const now = new Date();

    const checkTahapanWarning = (
        tanggalSelesai: string | undefined, 
        tipeDokumen: Dokumen['tipe'],
        namaTahapan: string
    ) => {
        if (tanggalSelesai && isValid(parseISO(tanggalSelesai)) && isPast(parseISO(tanggalSelesai))) {
            const dokumenTahapan = kegiatan.dokumen.filter(d => d.tipe === tipeDokumen && d.isWajib);
            if (dokumenTahapan.length > 0 && !dokumenTahapan.every(d => d.status === 'Approved')) {
                warnings.push(`Laporan ${namaTahapan} terlambat disetujui`);
            }
        }
    };

    checkTahapanWarning(kegiatan.tanggalSelesaiPersiapan, 'persiapan', 'Persiapan');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengumpulanData, 'pengumpulan-data', 'Pengumpulan Data');
    checkTahapanWarning(kegiatan.tanggalSelesaiPengolahanAnalisis, 'pengolahan-analisis', 'Pengolahan & Analisis');
    checkTahapanWarning(kegiatan.tanggalSelesaiDiseminasiEvaluasi, 'diseminasi-evaluasi', 'Diseminasi & Evaluasi');

    let status: Kegiatan['status'] = 'Persiapan';
    let color = 'status-badge-persiapan';
    
    if (kegiatan.tanggalSelesaiDiseminasiEvaluasi && isValid(parseISO(kegiatan.tanggalSelesaiDiseminasiEvaluasi)) && isPast(parseISO(kegiatan.tanggalSelesaiDiseminasiEvaluasi))) {
        status = 'Selesai';
        color = 'status-badge-selesai';
    } else if (kegiatan.tanggalMulaiDiseminasiEvaluasi && isValid(parseISO(kegiatan.tanggalMulaiDiseminasiEvaluasi)) && now >= parseISO(kegiatan.tanggalMulaiDiseminasiEvaluasi)) {
        status = 'Diseminasi & Evaluasi';
        color = 'status-badge-diseminasi';
    } else if (kegiatan.tanggalMulaiPengolahanAnalisis && isValid(parseISO(kegiatan.tanggalMulaiPengolahanAnalisis)) && now >= parseISO(kegiatan.tanggalMulaiPengolahanAnalisis)) {
        status = 'Pengolahan & Analisis';
        color = 'status-badge-pengolahan';
    } else if (kegiatan.tanggalMulaiPengumpulanData && isValid(parseISO(kegiatan.tanggalMulaiPengumpulanData)) && now >= parseISO(kegiatan.tanggalMulaiPengumpulanData)) {
        status = 'Pengumpulan Data';
        color = 'status-badge-pengumpulan';
    }

    return { status, color, warnings };
};

const getProgressBarValue = (ppl: PPLWithProgress) => {
    const totalBeban = parseInt(ppl.bebanKerja) || 0;
    if (totalBeban === 0) return 0;
    return ((ppl.progressApproved) / totalBeban) * 100;
};

const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
};

export default function Index() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState<KegiatanWithDynamicStatus | null>(null);
  const [updateModalActivity, setUpdateModalActivity] = useState<KegiatanWithDynamicStatus | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<Kegiatan | null>(null);
  const [showProgressSuccessModal, setShowProgressSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [deletedActivityName, setDeletedActivityName] = useState("");
  const [localPplProgress, setLocalPplProgress] = useState<PPLWithProgress[]>([]);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: "", message: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pplSearchView, setPplSearchView] = useState("");
  const [pplSearchUpdate, setPplSearchUpdate] = useState("");
  
  const [warningModalContent, setWarningModalContent] = useState<{title: string; warnings: string[]} | null>(null);

  const { data: activities = [], isLoading } = useQuery<Kegiatan[]>({ 
    queryKey: ['kegiatan'], 
    queryFn: fetchActivities 
  });

  const processedActivities = useMemo(() => {
    return activities.map(activity => ({
        ...activity,
        ppl: (activity.ppl || []).map(p => ({
            ...p,
            progressOpen: p.progressOpen || 0,
            progressSubmit: p.progressSubmit || 0,
            progressDiperiksa: p.progressDiperiksa || 0,
            progressApproved: p.progressApproved || 0,
        })) as PPLWithProgress[],
        dynamicStatus: calculateActivityStatus(activity),
    }));
  }, [activities]);

  const deleteMutation = useMutation({
    mutationFn: deleteActivity,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      setShowDeleteSuccessModal(true);
      setActivityToDelete(null);
    },
  });

  const progressMutation = useMutation({ 
    mutationFn: updatePplProgress, 
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] }); 
      setShowProgressSuccessModal(true);
    } 
  });

  const filteredActivities = useMemo(() => {
    return processedActivities.filter(activity => {
        const { status, warnings } = activity.dynamicStatus;
        const matchesSearch = activity.namaKegiatan.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
                              (statusFilter === "warning" ? warnings.length > 0 : status === statusFilter);
        return matchesSearch && matchesStatus;
    });
  }, [processedActivities, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const statusCounts = processedActivities.reduce((acc, act) => {
        const { status } = act.dynamicStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalKegiatan: processedActivities.length,
        persiapan: statusCounts['Persiapan'] || 0,
        pengumpulanData: statusCounts['Pengumpulan Data'] || 0,
        pengolahan: statusCounts['Pengolahan & Analisis'] || 0,
        diseminasi: statusCounts['Diseminasi & Evaluasi'] || 0,
        selesai: statusCounts['Selesai'] || 0,
        jumlahWarning: processedActivities.filter(a => a.dynamicStatus.warnings.length > 0).length,
    };
  }, [processedActivities]);

  const handleOpenUpdateModal = (activity: KegiatanWithDynamicStatus) => { 
    setLocalPplProgress(JSON.parse(JSON.stringify(activity.ppl || []))); 
    setUpdateModalActivity(activity); 
  };

  const handleUpdatePPL = (pplId: number, field: keyof PPLWithProgress, value: string) => {
    setLocalPplProgress(prev =>
        prev.map(p => {
            if (p.id === pplId) {
                const newValue = parseInt(value) || 0;
                const oldValue = p[field] as number;
                const diff = newValue - oldValue;
                const bebanKerja = parseInt(p.bebanKerja) || 0;

                if (newValue > bebanKerja) {
                    setAlertModal({ isOpen: true, title: "Validasi Gagal", message: `Nilai tidak boleh melebihi total beban kerja (${bebanKerja}).` });
                    return p;
                }

                const updatedPpl = { ...p, [field]: newValue };

                if (diff !== 0) {
                    switch (field) {
                        case 'progressSubmit':
                            if (diff > 0 && p.progressOpen - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Submit tidak bisa lebih besar dari Open!" });
                                return p;
                            }
                            updatedPpl.progressOpen -= diff;
                            break;
                        case 'progressDiperiksa':
                            if (diff > 0 && p.progressSubmit - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Diperiksa tidak bisa lebih besar dari Submit!" });
                                return p;
                            }
                            updatedPpl.progressSubmit -= diff;
                            break;
                        case 'progressApproved':
                            if (diff > 0 && p.progressDiperiksa - diff < 0) {
                                setAlertModal({ isOpen: true, title: "Validasi Gagal", message: "Approved tidak bisa lebih besar dari Diperiksa!" });
                                return p;
                            }
                            updatedPpl.progressDiperiksa -= diff;
                            break;
                        default:
                            break;
                    }
                }
                return updatedPpl;
            }
            return p;
        })
    );
  };
  
  const handleSaveProgress = () => {
    localPplProgress.forEach(ppl => {
      progressMutation.mutate({
        pplId: ppl.id!,
        progressData: {
          open: ppl.progressOpen,
          submit: ppl.progressSubmit,
          diperiksa: ppl.progressDiperiksa,
          approved: ppl.progressApproved,
          username: user?.username
        }
      });
    });
    setUpdateModalActivity(null);
  };

  const handleDeleteConfirm = () => {
    if (activityToDelete) {
        setDeletedActivityName(activityToDelete.namaKegiatan);
        deleteMutation.mutate(activityToDelete.id);
    }
  };

  const renderPPLProgress = (pplList: PPLWithProgress[], search: string) => (
    <div className="space-y-4">
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).map((ppl) => (
            <Card key={ppl.id} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 hover:shadow-md transition-all">
                <div className="space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-bps-blue-600" />
                                <h5 className="font-semibold text-gray-900">{ppl.namaPPL}</h5>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <p><span className="font-medium">PML:</span> {ppl.namaPML}</p>
                                <p><span className="font-medium">Beban Kerja:</span> {ppl.bebanKerja} {ppl.satuanBebanKerja}</p>
                                <p><span className="font-medium">Honor:</span> Rp {parseInt(ppl.besaranHonor).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <div className="text-xl font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(1)}%</div>
                            </div>
                            <div className="text-xs text-gray-500">Progress Selesai</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-white rounded-lg border">
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Open</Label>
                            <div className="mt-1 text-lg font-bold text-blue-600">{ppl.progressOpen || 0}</div>
                            <div className="text-xs text-gray-500">{ppl.satuanBebanKerja}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Submit</Label>
                            <div className="mt-1 text-lg font-bold text-yellow-600">{ppl.progressSubmit || 0}</div>
                            <div className="text-xs text-gray-500">{ppl.satuanBebanKerja}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Diperiksa</Label>
                            <div className="mt-1 text-lg font-bold text-orange-600">{ppl.progressDiperiksa || 0}</div>
                            <div className="text-xs text-gray-500">{ppl.satuanBebanKerja}</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                            <Label className="text-xs text-gray-500 uppercase tracking-wide">Approved</Label>
                            <div className="mt-1 text-lg font-bold text-green-600">{ppl.progressApproved || 0}</div>
                            <div className="text-xs text-gray-500">{ppl.satuanBebanKerja}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress Keseluruhan</span>
                            <span className="font-medium">{getProgressBarValue(ppl).toFixed(1)}%</span>
                        </div>
                        <Progress value={getProgressBarValue(ppl)} className="h-3" />
                    </div>
                </div>
            </Card>
        ))}
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">
                    {pplList.length === 0 ? "Tidak ada alokasi PPL untuk tahap ini." : "PPL tidak ditemukan."}
                </p>
            </div>
        )}
    </div>
  );

  const renderPPLUpdate = (pplList: PPLWithProgress[], search: string) => (
    <div className="space-y-4">
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).map(ppl => (
            <Card key={ppl.id} className="p-4">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h5 className="font-medium text-gray-900">{ppl.namaPPL}</h5>
                            <p className="text-sm text-gray-600">Total Beban: {ppl.bebanKerja} {ppl.satuanBebanKerja}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-bps-blue-600">{getProgressBarValue(ppl).toFixed(1)}%</div>
                            <div className="text-xs text-gray-500">Approved</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                        <div className="text-center">
                            <Label className="text-xs text-gray-600">Open</Label>
                            <Input type="number" value={ppl.progressOpen} disabled className="mt-1 text-center"/>
                        </div>
                        {['submit', 'diperiksa', 'approved'].map(field => (
                            <div key={field} className="text-center">
                                <Label className="text-xs text-gray-600 capitalize">{field}</Label>
                                <Input 
                                    type="number" 
                                    min="0" 
                                    value={(ppl as any)[`progress${field.charAt(0).toUpperCase() + field.slice(1)}`]} 
                                    onChange={e => handleUpdatePPL(ppl.id!, `progress${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof PPLWithProgress, e.target.value)} 
                                    className="mt-1 text-center" 
                                />
                            </div>
                        ))}
                    </div>
                    <Progress value={getProgressBarValue(ppl)} className="h-2" />
                </div>
            </Card>
        ))}
        {pplList.filter(p => (p.namaPPL || '').toLowerCase().includes(search.toLowerCase())).length === 0 && (
            <p className="text-center text-gray-500 py-4">
                {pplList.length === 0 ? "Tidak ada alokasi PPL untuk tahap ini." : "PPL tidak ditemukan."}
            </p>
        )}
    </div>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bps-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data kegiatan...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-bps-blue-500 to-bps-blue-600 rounded-2xl p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Dashboard Monitoring PPL</h1>
                        <p className="text-bps-blue-100 text-lg">Pantau progress dan kelola semua kegiatan secara real-time</p>
                        <div className="flex items-center space-x-4 mt-4">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeID })}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4" />
                                <span className="text-sm">Selamat datang, {user?.name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:block">
                        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                            <BarChart className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {[
                    { label: "Total Kegiatan", value: stats.totalKegiatan, icon: Activity, color: "bps-blue", bgColor: "bg-bps-blue-50 border-bps-blue-200" },
                    { label: "Persiapan", value: stats.persiapan, icon: BookOpen, color: "blue", bgColor: "bg-blue-50 border-blue-200" },
                    { label: "Pengumpulan Data", value: stats.pengumpulanData, icon: Users, color: "yellow", bgColor: "bg-yellow-50 border-yellow-200" },
                    { label: "Pengolahan", value: stats.pengolahan, icon: BarChart, color: "green", bgColor: "bg-green-50 border-green-200" },
                    { label: "Diseminasi", value: stats.diseminasi, icon: Send, color: "indigo", bgColor: "bg-indigo-50 border-indigo-200" },
                    { label: "Selesai", value: stats.selesai, icon: CheckSquare, color: "purple", bgColor: "bg-purple-50 border-purple-200" },
                    { label: "Warning", value: stats.jumlahWarning, icon: AlertTriangle, color: "red", bgColor: "bg-red-50 border-red-200" }
                ].map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={index} className={cn("border-l-4 hover:shadow-lg transition-all duration-200 hover:-translate-y-1", stat.bgColor)}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <Icon className={cn("w-8 h-8", `text-${stat.color}-500`)} />
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Search and Filter */}
            <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Cari Kegiatan</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input 
                                    id="search" 
                                    type="text" 
                                    placeholder="Cari nama kegiatan, ketua tim..." 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    className="pl-10 h-11 border-gray-300 focus:border-bps-blue-500 focus:ring-bps-blue-500" 
                                />
                            </div>
                        </div>
                        <div className="sm:w-64">
                            <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="h-11 border-gray-300">
                                    <Filter className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Semua Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Status</SelectItem>
                                    <SelectItem value="Persiapan">Persiapan</SelectItem>
                                    <SelectItem value="Pengumpulan Data">Pengumpulan Data</SelectItem>
                                    <SelectItem value="Pengolahan & Analisis">Pengolahan & Analisis</SelectItem>
                                    <SelectItem value="Diseminasi & Evaluasi">Diseminasi & Evaluasi</SelectItem>
                                    <SelectItem value="Selesai">Selesai</SelectItem>
                                    <SelectItem value="warning">Ada Warning</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredActivities.length === 0 ? (
                    <div className="col-span-full text-center py-16">
                        <div className="text-gray-300 mb-4">
                            <Activity className="w-20 h-20 mx-auto" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-2">Tidak ada kegiatan ditemukan</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            {searchTerm ? `Tidak ada kegiatan yang cocok dengan pencarian "${searchTerm}"` : 'Tidak ada kegiatan dengan filter yang dipilih'}
                        </p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => {
                        const { status, color, warnings } = activity.dynamicStatus;
                        
                        const getStageDates = () => {
                            const formatDate = (dateString?: string) => dateString ? format(new Date(dateString), 'dd MMM yyyy', { locale: localeID }) : '-';
                            let stageLabel = "Persiapan";
                            let startDate = activity.tanggalMulaiPersiapan;
                            let endDate = activity.tanggalSelesaiPersiapan;

                            switch (status) {
                                case 'Pengumpulan Data':
                                    stageLabel = "Pengumpulan Data";
                                    startDate = activity.tanggalMulaiPengumpulanData;
                                    endDate = activity.tanggalSelesaiPengumpulanData;
                                    break;
                                case 'Pengolahan & Analisis':
                                    stageLabel = "Pengolahan & Analisis";
                                    startDate = activity.tanggalMulaiPengolahanAnalisis;
                                    endDate = activity.tanggalSelesaiPengolahanAnalisis;
                                    break;
                                case 'Diseminasi & Evaluasi':
                                    stageLabel = "Diseminasi & Evaluasi";
                                    startDate = activity.tanggalMulaiDiseminasiEvaluasi;
                                    endDate = activity.tanggalSelesaiDiseminasiEvaluasi;
                                    break;
                                case 'Selesai':
                                    return (
                                        <div className="flex items-center space-x-2">
                                            <CheckSquare className="w-4 h-4 text-green-600" />
                                            <div>
                                                <p className="text-gray-500 text-sm">Selesai Pada</p>
                                                <p className="font-medium">{formatDate(activity.tanggalSelesaiDiseminasiEvaluasi)}</p>
                                            </div>
                                        </div>
                                    );
                            }
                            return (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        <div>
                                            <p className="text-gray-500">Mulai {stageLabel}</p>
                                            <p className="font-medium">{formatDate(startDate)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="w-4 h-4 text-red-600" />
                                        <div>
                                            <p className="text-gray-500">Target Selesai</p>
                                            <p className="font-medium">{formatDate(endDate)}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        };

                        return (
                            <Card key={activity.id} className="bps-card-hover border border-gray-200 overflow-hidden">
                                <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg leading-tight mb-2">{activity.namaKegiatan}</CardTitle>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                <User className="w-4 h-4" />
                                                <span>Ketua: {activity.namaKetua}</span>
                                            </div>
                                        </div>
                                        <Badge className={cn("ml-2 whitespace-nowrap border", warnings.length > 0 ? 'status-badge-warning' : color)}>
                                            {warnings.length > 0 ? 'Warning' : status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-sm font-medium text-gray-700">Progress Keseluruhan</span>
                                            <div className="flex items-center space-x-1">
                                                <TrendingUp className="w-4 h-4 text-bps-blue-600" />
                                                <span className="text-sm font-bold text-bps-blue-600">{activity.progressKeseluruhan || 0}%</span>
                                            </div>
                                        </div>
                                        <Progress value={activity.progressKeseluruhan || 0} className="h-3" />
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {getStageDates()}
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Update: {getRelativeTime(activity.lastUpdated)}</span>
                                        </div>
                                        {activity.lastUpdatedBy && (
                                            <div className="flex items-center space-x-1">
                                                <User className="w-3 h-3" />
                                                <span>oleh {activity.lastUpdatedBy}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {warnings.length > 0 && (
                                        <Button 
                                            variant="link" 
                                            className="p-0 h-auto text-red-600 text-xs mt-2"
                                            onClick={() => setWarningModalContent({ title: activity.namaKegiatan, warnings })}
                                        >
                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                            Lihat {warnings.length} Peringatan
                                        </Button>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-2 pt-4">
                                        <Button variant="outline" size="sm" onClick={() => { setSelectedActivity(activity); setPplSearchView(""); }}>
                                            <Eye className="w-4 h-4 mr-1" />Lihat Detail
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => { handleOpenUpdateModal(activity); setPplSearchUpdate(""); }}>
                                            <RefreshCw className="w-4 h-4 mr-1" />Update Progress
                                        </Button>
                                        <Button variant="outline" size="sm" className="col-span-2">
                                            <FileText className="w-4 h-4 mr-1" />Lihat Dokumen
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
            
            {/* Detail Modal */}
            <Dialog open={!!selectedActivity} onOpenChange={(isOpen) => { if (!isOpen) setSelectedActivity(null); }}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Detail Kegiatan: {selectedActivity?.namaKegiatan}</DialogTitle>
                    </DialogHeader>
                    {selectedActivity && (
                        <div className="space-y-6 p-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <FileCheck className="w-5 h-5 mr-2 text-bps-blue-600" />
                                        Informasi Kegiatan
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Ketua Tim:</span>
                                            <span className="font-medium">{selectedActivity.namaKetua}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Status:</span>
                                            <Badge className={cn(selectedActivity.dynamicStatus.color)}>
                                                {selectedActivity.dynamicStatus.status}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Progress:</span>
                                            <span className="font-medium text-bps-blue-600">{selectedActivity.progressKeseluruhan}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Terakhir Update:</span>
                                            <span className="font-medium">{getRelativeTime(selectedActivity.lastUpdated)}</span>
                                        </div>
                                    </div>
                                </Card>
                                
                                <Card className="p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                        <Calendar className="w-5 h-5 mr-2 text-bps-blue-600" />
                                        Jadwal Kegiatan
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        {[
                                            { label: "Persiapan", start: selectedActivity.tanggalMulaiPersiapan, end: selectedActivity.tanggalSelesaiPersiapan },
                                            { label: "Pengumpulan Data", start: selectedActivity.tanggalMulaiPengumpulanData, end: selectedActivity.tanggalSelesaiPengumpulanData },
                                            { label: "Pengolahan & Analisis", start: selectedActivity.tanggalMulaiPengolahanAnalisis, end: selectedActivity.tanggalSelesaiPengolahanAnalisis },
                                            { label: "Diseminasi & Evaluasi", start: selectedActivity.tanggalMulaiDiseminasiEvaluasi, end: selectedActivity.tanggalSelesaiDiseminasiEvaluasi }
                                        ].map((phase, index) => (
                                            <div key={index} className="flex justify-between">
                                                <span className="text-gray-500">{phase.label}:</span>
                                                <span className="font-medium">
                                                    {phase.start && phase.end ? 
                                                        `${format(new Date(phase.start), 'dd MMM', { locale: localeID })} - ${format(new Date(phase.end), 'dd MMM yyyy', { locale: localeID })}` 
                                                        : '-'
                                                    }
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                            
                            <Card className="p-4">
                                <h4 className="font-semibold text-gray-900 mb-3">Deskripsi Kegiatan</h4>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {selectedActivity.deskripsiKegiatan || "Tidak ada deskripsi."}
                                </p>
                            </Card>
                            
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-bps-blue-600" />
                                        Progress PPL per Tahap
                                    </h4>
                                    <div className="w-64">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <Input 
                                                placeholder="Cari PPL..." 
                                                value={pplSearchView} 
                                                onChange={(e) => setPplSearchView(e.target.value)} 
                                                className="pl-10 h-9" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Tabs defaultValue="persiapan" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                                        <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                                        <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                                        <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
                                    </TabsList>
                                    <div className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
                                        <TabsContent value="persiapan" className="space-y-4">
                                            {renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'persiapan'), pplSearchView)}
                                        </TabsContent>
                                        <TabsContent value="pengumpulan-data" className="space-y-4">
                                            {renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pengumpulan-data'), pplSearchView)}
                                        </TabsContent>
                                        <TabsContent value="pengolahan-analisis" className="space-y-4">
                                            {renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'pengolahan-analisis'), pplSearchView)}
                                        </TabsContent>
                                        <TabsContent value="diseminasi-evaluasi" className="space-y-4">
                                            {renderPPLProgress(selectedActivity.ppl.filter(p => p.tahap === 'diseminasi-evaluasi'), pplSearchView)}
                                        </TabsContent>
                                    </div>
                                </Tabs>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Update Progress Modal */}
            <Dialog open={!!updateModalActivity} onOpenChange={(isOpen) => { if (!isOpen) setUpdateModalActivity(null); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Update Progress: {updateModalActivity?.namaKegiatan}</DialogTitle>
                    </DialogHeader>
                    {updateModalActivity && (
                        <div className="flex-grow overflow-hidden flex flex-col">
                            <Tabs defaultValue="persiapan" className="flex-grow flex flex-col overflow-hidden">
                                <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
                                    <TabsTrigger value="persiapan">Persiapan</TabsTrigger>
                                    <TabsTrigger value="pengumpulan-data">Pengumpulan Data</TabsTrigger>
                                    <TabsTrigger value="pengolahan-analisis">Pengolahan & Analisis</TabsTrigger>
                                    <TabsTrigger value="diseminasi-evaluasi">Diseminasi & Evaluasi</TabsTrigger>
                                </TabsList>
                                <div className="relative mt-4 flex-shrink-0">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input 
                                        placeholder="Cari nama PPL..." 
                                        value={pplSearchUpdate} 
                                        onChange={(e) => setPplSearchUpdate(e.target.value)} 
                                        className="pl-10 mb-4 h-9" 
                                    />
                                </div>
                                <div className="overflow-y-auto flex-grow pr-2">
                                    <TabsContent value="persiapan">
                                        {renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'persiapan'), pplSearchUpdate)}
                                    </TabsContent>
                                    <TabsContent value="pengumpulan-data">
                                        {renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'pengumpulan-data'), pplSearchUpdate)}
                                    </TabsContent>
                                    <TabsContent value="pengolahan-analisis">
                                        {renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'pengolahan-analisis'), pplSearchUpdate)}
                                    </TabsContent>
                                    <TabsContent value="diseminasi-evaluasi">
                                        {renderPPLUpdate(localPplProgress.filter(p => p.tahap === 'diseminasi-evaluasi'), pplSearchUpdate)}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    )}
                    <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
                        <Button variant="outline" onClick={() => setUpdateModalActivity(null)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveProgress} className="bps-gradient text-white">
                            Simpan Progress
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {/* Warning Modal */}
            <Dialog open={!!warningModalContent} onOpenChange={() => setWarningModalContent(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <span>Peringatan untuk: {warningModalContent?.title}</span>
                        </DialogTitle>
                        <DialogDescription>
                            Daftar peringatan yang terdeteksi untuk kegiatan ini.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3">
                        {warningModalContent?.warnings.map((warning, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-red-800 text-sm">{warning}</span>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
            
            {/* Modals */}
            <ConfirmationModal 
                isOpen={!!activityToDelete} 
                onConfirm={handleDeleteConfirm} 
                onClose={() => setActivityToDelete(null)} 
                title="Konfirmasi Hapus" 
                description={`Yakin ingin menghapus "${activityToDelete?.namaKegiatan}"?`} 
            />
            <SuccessModal 
                isOpen={showProgressSuccessModal} 
                onClose={() => setShowProgressSuccessModal(false)} 
                title="Progress Berhasil Diperbarui!" 
                autoCloseDelay={2000} 
            />
            <SuccessModal 
                isOpen={showDeleteSuccessModal} 
                onClose={() => setShowDeleteSuccessModal(false)} 
                title="Kegiatan Berhasil Dihapus!" 
                description={`Kegiatan "${deletedActivityName}" telah berhasil dihapus.`} 
                autoCloseDelay={2000} 
            />
            <AlertModal 
                isOpen={alertModal.isOpen} 
                onClose={() => setAlertModal({ isOpen: false, title: "", message: "" })} 
                title={alertModal.title} 
                description={alertModal.message} 
            />
        </div>
    </Layout>
  );
}
