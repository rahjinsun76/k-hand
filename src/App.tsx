import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  googleProvider, 
  getNotices, 
  getGallery, 
  getMainConfig,
  updateMainConfig,
  addNotice, 
  updateNotice,
  deleteNotice, 
  addGalleryItem, 
  deleteGalleryItem,
  updateGalleryItem,
  addApplication,
  getApplications,
  deleteApplication
} from './firebase';
import heroImg from './assets/images/hero.jpg';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { 
  Menu, 
  X, 
  Phone, 
  Mail, 
  Instagram, 
  BookOpen, 
  ExternalLink, 
  ChevronRight,
  Heart,
  Baby,
  Smile,
  GraduationCap,
  ShoppingBag,
  ArrowRight,
  Plus,
  Trash2,
  Edit,
  LogOut,
  User as UserIcon,
  ClipboardList,
  Image as ImageIcon
} from 'lucide-react';

// --- Constants ---
const DEFAULT_NOTICES = [
  { date: "2026.05.10", title: "하반기 협회 정기 교육 신청 안내 (선착순)", badge: "중요" },
  { date: "2026.05.01", title: "5월 가정의 달 기념 특강 일정 안내", badge: "교육" },
  { date: "2026.04.15", title: "협회 홈페이지 리뉴얼 이벤트 결과 발표", badge: "이벤트" }
];

const DEFAULT_GALLERY = [
  { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e15cb?auto=format&fit=crop&q=80&w=800', title: '한지 공예 램프', category: '자격증' },
  { src: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=800', title: '퀸링 플라워 아트', category: '성인' },
  { src: 'https://images.unsplash.com/photo-1506806732259-39c2d4a78ae7?auto=format&fit=crop&q=80&w=800', title: '아동 단체 수업', category: '아동' },
  { src: 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&q=80&w=800', title: '아기 한복 공예', category: '아동' },
  { src: 'https://images.unsplash.com/photo-1544411047-c491e34a2450?auto=format&fit=crop&q=80&w=800', title: '협회 워크숍', category: '전체' },
  { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e15cb?auto=format&fit=crop&q=80&w=800', title: '작품 전시', category: '전체' },
  { src: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=800', title: '아동 창의 공예', category: '아동' },
  { src: 'https://images.unsplash.com/photo-1581579438747-1dc8c17bbce4?auto=format&fit=crop&q=80&w=800', title: '어르신 치유 프로그램', category: '노인' },
  { src: 'https://images.unsplash.com/photo-1605722243979-fe0be8158232?auto=format&fit=crop&q=80&w=800', title: '자수 작업', category: '성인' },
  { src: 'https://images.unsplash.com/photo-1544256718-3bcf237f3974?auto=format&fit=crop&q=80&w=800', title: '페이퍼 아트 클래스', category: '성인' },
  { src: 'https://images.unsplash.com/photo-1540324153951-891179631b44?auto=format&fit=crop&q=80&w=800', title: '목공예 실습', category: '자격증' },
  { src: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&q=80&w=800', title: '협회 봉사 활동', category: '전체' }
];

// --- Components ---

const EditModal = ({ 
  isOpen, 
  onClose, 
  title, 
  initialValue, 
  onSave,
  isNotice = false
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  initialValue: string | { title: string; badge: string; content: string }; 
  onSave: (value: any) => void;
  isNotice?: boolean;
}) => {
  const [value, setValue] = useState(typeof initialValue === 'string' ? initialValue : '');
  const [noticeData, setNoticeData] = useState({ title: '', badge: '공지', content: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
      if (isNotice) {
        if (typeof initialValue === 'object') {
          setNoticeData(initialValue);
        } else {
          const [t, b, c] = initialValue.split('|').map(s => s.trim());
          setNoticeData({ 
            title: t || '', 
            badge: b || '공지', 
            content: c || '' 
          });
        }
      } else {
        setValue(typeof initialValue === 'string' ? initialValue : '');
      }
    }
  }, [isOpen, initialValue, isNotice]);

  const handleNoticeSave = () => {
    if (isNotice) {
      onSave(noticeData);
    } else {
      onSave(value);
    }
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions: 800px
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to 0.5 quality JPEG
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          setValue(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const isImageEdit = title.includes("사진") || title.includes("이미지");

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <div className="space-y-6">
          {isNotice ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">공지 제목</label>
                <input 
                  type="text"
                  value={noticeData.title}
                  onChange={(e) => setNoticeData({ ...noticeData, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">배지 (예: 중요, 알림, 교육)</label>
                <input 
                  type="text"
                  value={noticeData.badge}
                  onChange={(e) => setNoticeData({ ...noticeData, badge: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="배지 내용"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">상세 내용</label>
                <textarea 
                  value={noticeData.content}
                  onChange={(e) => setNoticeData({ ...noticeData, content: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[200px] text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="공지 상세 내용을 입력하세요..."
                />
              </div>
            </div>
          ) : (
            <>
              {isImageEdit && (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-500 ml-1">직접 업로드</label>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center group hover:border-primary transition-all">
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    {value && value.startsWith('data:image') ? (
                      <div className="space-y-4">
                        <img src={value} className="h-32 mx-auto rounded-2xl shadow-xl object-cover aspect-video" alt="Preview" />
                        <p className="text-xs text-primary font-bold">새로운 사진이 준비되었습니다</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                          <ImageIcon size={32} className="text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium font-sans">마우스로 클릭하여 사진을 선택하세요</p>
                      </div>
                    )}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-6 px-8 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center gap-2 mx-auto"
                    >
                      <Plus size={16} /> 내 기기에서 사진 찾기
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 ml-1">
                  {isImageEdit ? "이미지 주소(URL) 또는 데이터 코드" : "내용 입력"}
                </label>
                <textarea 
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[100px] text-xs font-mono focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder={isImageEdit ? "http://... 형태의 주소나 업로드된 코드가 여기에 표시됩니다" : "내용을 입력하세요..."}
                />
              </div>
            </>
          )}
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button 
              onClick={handleNoticeSave}
              className="flex-1 py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
              저장하기
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ user, onLogin, onLogout, isAdmin, onOpenAdminView }: { user: any, onLogin: () => void, onLogout: () => void, isAdmin: boolean, onOpenAdminView: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: '협회소개', href: '#mission' },
    { name: '공예치료', href: '#about' },
    { name: '프로그램안내', href: '#programs' },
    { name: '자격증과정', href: '#certification' },
    { name: '협회활동', href: '#association-gallery' },
    { name: '공지사항', href: '#notice' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <span className="text-xl font-bold tracking-tighter text-primary">
              한국공예치료사 협회 K-Hand
            </span>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="flex items-baseline space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-700 hover:text-primary px-3 py-2 text-[15px] font-semibold transition-colors"
                >
                  {link.name}
                </a>
              ))}
              <a 
                href="https://mkt.shopping.naver.com/link/6878ed78af62921b08b9bd2c"
                target="_blank"
                rel="noreferrer"
                className="ml-4 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all flex items-center gap-2 shadow-sm"
              >
                온라인 쇼핑몰 <ShoppingBag size={16} />
              </a>
              {user ? (
                <div className="flex items-center gap-2">
                  {isAdmin && (
                      <button 
                        onClick={onOpenAdminView}
                        className="flex items-center gap-1 text-primary hover:text-primary-dark p-2 transition-colors font-bold text-xs"
                        title="신청 현황 확인"
                      >
                      <ClipboardList size={18} />
                      <span className="hidden sm:inline">신청 목록</span>
                    </button>
                  )}
                  <button 
                    onClick={onLogout}
                    className="ml-2 flex items-center gap-1 text-slate-500 hover:text-red-500 p-2 transition-colors font-bold text-xs"
                    title="로그아웃"
                  >
                    <LogOut size={18} />
                    <span>로그아웃</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLogin}
                  className="ml-2 flex items-center gap-1 text-slate-500 hover:text-primary p-2 transition-colors font-bold text-xs border border-slate-100 rounded-lg hover:border-primary/20"
                  title="관리자 로그인"
                >
                  <UserIcon size={18} />
                  <span>관리자</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-700 hover:text-primary p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden shadow-xl"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-slate-700 hover:text-primary block px-3 py-3 text-sm font-semibold border-b border-slate-50"
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <a 
                href="https://mkt.shopping.naver.com/link/6878ed78af62921b08b9bd2c"
                target="_blank" 
                rel="noreferrer"
                className="bg-primary text-white block px-3 py-4 rounded-xl text-center text-sm font-bold hover:bg-primary-dark mt-4"
              >
                온라인 쇼핑몰 바로가기
              </a>
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4 px-3">
                {user ? (
                  <>
                    {isAdmin && (
                      <button 
                        onClick={() => { onOpenAdminView(); setIsOpen(false); }}
                        className="flex items-center gap-2 text-sm font-semibold text-primary"
                      >
                        <ClipboardList size={16} /> 신청 목록 확인
                      </button>
                    )}
                    <button 
                      onClick={() => { onLogout(); setIsOpen(false); }}
                      className="flex items-center gap-2 text-sm font-semibold text-red-500"
                    >
                      <LogOut size={16} /> 로그아웃
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { onLogin(); setIsOpen(false); }}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-700"
                  >
                    <UserIcon size={16} /> 관리자 로그인
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ config, onEditImage }: { config: any, onEditImage: (field: string) => void }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-white">
       {/* Decorative Background Elements */}
       <div className="absolute top-20 right-[-10%] w-[60%] h-[80%] bg-secondary/20 rounded-full blur-[120px] -z-10" />
       
       <div className="section-container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="h-0.5 w-8 bg-primary" />
              <span className="text-xs font-bold tracking-widest text-primary uppercase">
                Korea-Hand Healing Art
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-8 leading-[1.1] text-slate-900 break-keep">
              공예치료 전문,<br />
              <span className="text-primary italic">한국공예치료사 협회</span>
            </h1>
            <p className="text-base md:text-lg text-slate-600 mb-10 leading-relaxed max-w-lg break-keep">
              공예치료를 통해 나를 만나는 시간.<br />
              한국공예치료사 협회가 당신의 마음을 보듬고 삶의 위안을 더합니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#association-gallery" className="bg-primary text-white px-10 py-5 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2 text-base cursor-pointer">
                협회 활동 보기 <ChevronRight size={22} />
              </a>
              <a href="#contact" className="bg-white text-primary border-2 border-primary/10 px-10 py-5 rounded-2xl font-bold hover:bg-secondary/30 transition-all text-base cursor-pointer">
                교육 상담
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className={`aspect-[4/5] md:aspect-square rounded-[40px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative bg-slate-100 flex items-center justify-center border-4 border-dashed border-slate-200 ${onEditImage ? 'cursor-pointer' : ''}`}
              onClick={() => onEditImage && onEditImage('heroImage')}
            >
              {config?.heroImage ? (
                <motion.img 
                  src={config.heroImage || undefined} 
                  alt="한국공예치료사협회 공예치료 전문가 실습" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
              ) : (
                <motion.img 
                  src={heroImg} 
                  alt="한국공예치료사협회 공예치료 프로그램 전시" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  decoding="async"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent pointer-events-none" />
              
              {onEditImage && (
                <div 
                  className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl z-30 flex items-center gap-2 font-bold text-sm"
                >
                  <ImageIcon size={20} />
                  <span>사진 변경</span>
                </div>
              )}
            </motion.div>
            
            {/* Achievement Badge Removed */}

            {/* Floating Label */}
            <div className="absolute -bottom-10 -left-6 lg:-left-10 bg-[#004D40] p-6 lg:p-8 rounded-[32px] shadow-2xl text-white">
               <div className="flex items-center gap-4 mb-3">
                  <Heart className="text-yellow-400" fill="currentColor" size={24} />
                  <span className="font-bold text-lg">Healing Focus</span>
               </div>
               <p className="text-white/70 text-sm leading-relaxed break-keep">말로 다 전하지 못한 감정을<br />손작업을 통해 천천히 마주합니다.</p>
            </div>
          </motion.div>
       </div>
    </section>
  );
};

const About = ({ config, onEditImage }: { config: any, onEditImage: (field: string) => void }) => {
  return (
    <section id="about" className="bg-slate-50 py-24 md:py-32">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
           <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
           >
              <h2 className="text-primary font-bold tracking-[0.2em] mb-4 uppercase text-sm">Main Concept</h2>
              <h3 className="text-2xl md:text-3xl font-bold mb-8 text-slate-900 leading-tight break-keep">
                공예치료란 무엇인가요?
              </h3>
              <p className="text-base text-slate-600 mb-10 leading-loose break-keep">
                공예치료란 손으로 만드는 과정 속에서 마음을 돌봅니다. 다양한 공예 활동을 통해 감정을 표현하고 정서적 안정을 돕는 심리치유를 목적으로 합니다. 반복되는 손작업은 마음을 차분하게 하고 완성의 경험을 통해 성취감을 느낄 수 있게 됩니다. 언어로 표현하기 어려운 감정을 표현할 수 있습니다.
              </p>
              
              <div className="space-y-6">
                {[
                  { t: "심리적 안정과 스트레스 완화", d: "손작업에 집중하며 일상의 긴장을 해소하고 정서적 평온을 찾습니다." },
                  { t: "몰입(Flow)과 자아 효능감 증진", d: "만드는 즐거움 속에서 몰입을 경험하고 완성의 성취감을 느낍니다." },
                  { t: "우울감과 불안 완화", d: "다양한 재료를 매개로 부정적 감정을 완화하고 심리적 탄력성을 높입니다." },
                  { t: "사회적 치유와 관계 형성", d: "함께 작품을 만들고 소통하며 소속감과 정서적 유대를 강화합니다." }
                ].map((point, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                      {i+1}
                    </div>
                    <div>
                      <h4 className="font-bold text-base mb-1 break-keep">{point.t}</h4>
                      <p className="text-slate-500 text-sm break-keep">{point.d}</p>
                    </div>
                  </div>
                ))}
              </div>
           </motion.div>

            <div className="relative group">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className={`aspect-video lg:aspect-square bg-slate-100 rounded-[48px] overflow-hidden shadow-2xl border-[16px] border-white relative ${onEditImage ? 'cursor-pointer' : ''}`}
                onClick={() => onEditImage && onEditImage('aboutImage')}
              >
                 <motion.img 
                   src={config?.aboutImage || "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?auto=format&fit=crop&q=80&w=800"} 
                   className="w-full h-full object-cover" 
                   referrerPolicy="no-referrer" 
                   alt="공예치료 도구와 다양한 치유 재료"
                   loading="lazy"
                   decoding="async"
                   animate={{ scale: [1, 1.1, 1] }}
                   transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                 />
                 {onEditImage && (
                    <div className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm">
                      <ImageIcon size={20} />
                      <span>사진 변경</span>
                    </div>
                 )}
              </motion.div>
              {/* Accents */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary rounded-full -z-10" />
           </div>
        </div>
      </div>
    </section>
  );
};

const Programs = ({ config, onEditProgramImage }: { config: any, onEditProgramImage: (id: number) => void }) => {
  const programs = [
    {
      id: 1,
      title: "성인대상",
      bullets: ["스트레스 완화", "감정회복", "자기돌봄", "임산부 태교"],
      image: config?.programImages?.[1] || "https://images.unsplash.com/photo-1605722243979-fe0be8158232?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 2,
      title: "노인대상",
      bullets: ["기억회상", "치매예방", "우울감 완화"],
      image: config?.programImages?.[2] || "https://images.unsplash.com/photo-1513519245088-0e12902e15cb?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 3,
      title: "아동대상",
      bullets: ["정서적 안정", "자기조절", "사회성 향상 및 관계형성", "자신감 향상"],
      image: config?.programImages?.[3] || "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=600",
    },
    {
      id: 4,
      title: "기관 맞춤형 출강 프로그램",
      bullets: ["기업", "문화센터", "복지관 & 요양원", "학교 & 단체"],
      image: config?.programImages?.[4] || "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=800",
    }
  ];

  return (
    <section id="programs" className="bg-white py-24">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-primary font-bold mb-4 tracking-widest uppercase text-sm">Programming</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 break-keep">대상별 맞춤형 프로그램</h3>
          </div>

          <div className="space-y-12">
            {programs.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex flex-col md:flex-row items-start gap-8 md:gap-16 pb-12 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-start gap-8 flex-1">
                    <span className="text-7xl font-black text-[#004D40] leading-none opacity-90">{item.id}</span>
                    <div className="pt-2">
                       <h4 className="text-2xl font-extrabold text-slate-900 mb-6 break-keep">{item.title}</h4>
                       <ul className="space-y-3">
                          {item.bullets.map((bullet, bi) => (
                            <li key={bi} className="flex items-center gap-3 text-slate-600 font-medium whitespace-nowrap">
                               <div className="w-1.5 h-1.5 bg-[#004D40] rounded-full shrink-0" />
                               <span className="text-lg break-keep">{bullet}</span>
                            </li>
                          ))}
                       </ul>
                    </div>
                  </div>
                  
                  <div 
                    className={`w-full md:w-72 aspect-[4/3] rounded-3xl overflow-hidden relative shadow-xl group ${onEditProgramImage ? 'cursor-pointer' : ''}`}
                    onClick={() => onEditProgramImage && onEditProgramImage(item.id)}
                  >
                    <motion.img 
                      src={item.image} 
                      alt={`공예치료 프로그램 - ${item.title}`} 
                      className="w-full h-full object-cover transition-transform duration-700"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                      whileHover={{ scale: 1.05 }}
                    />
                    {onEditProgramImage && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl flex items-center gap-2 font-bold text-xs text-primary shadow-xl">
                           <ImageIcon size={16} /> 사진 변경
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Certification = ({ config, onEditImage, onOpenApply, isAdmin, onOpenAdminView }: { config: any, onEditImage?: (field: string) => void, onOpenApply: () => void, isAdmin: boolean, onOpenAdminView: () => void }) => {
  return (
    <section id="certification" className="bg-[#004D40] py-24 text-white">
      <div className="section-container">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="flex-1"
            >
               <h2 className="text-primary-foreground/60 font-bold mb-4 tracking-widest uppercase">Professional</h2>
               <h3 className="text-2xl md:text-3xl font-bold mb-8 break-keep">공예치료사 자격증 과정</h3>
               <p className="text-white/70 text-base mb-10 leading-relaxed max-w-xl break-keep">
                  이론부터 실전 현장 적용까지, 전문 강사진의 노하우를 직접 전수받습니다. 
                  자격증 취득 후 활발한 활동을 하실 수 있도록 협회가 든든한 파트너가 됩니다.
               </p>
               <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "기초 공예 이론 및 심리",
                    "재료별 맞춤 치유법",
                    "대상별 커뮤니케이션",
                    "프로그램 기획 및 운영"
                  ].map((item) => (
                    <div key={item} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                       <GraduationCap className="text-primary/60" size={20} />
                       <span className="font-medium break-keep">{item}</span>
                    </div>
                  ))}
               </div>
               <div className="flex flex-wrap gap-4 mt-12">
                 <button 
                  onClick={() => {
                    onOpenApply();
                  }}
                  className="bg-white text-[#004D40] px-10 py-4 rounded-2xl font-bold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer"
                 >
                    교육과정 신청하기
                 </button>

                 {isAdmin && (
                   <button 
                    onClick={onOpenAdminView}
                    className="bg-primary/20 text-primary border border-primary/30 px-10 py-4 rounded-2xl font-bold hover:bg-primary/30 active:scale-95 transition-all shadow-xl cursor-pointer flex items-center gap-2"
                   >
                      <ClipboardList size={20} />
                      신청 목록 확인
                   </button>
                 )}
               </div>
            </motion.div>
            
            <div className="flex-1 w-full max-w-lg">
                <motion.div 
                   initial={{ opacity: 0, x: 30 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   viewport={{ once: true }}
                   className="aspect-square relative bg-slate-100 cursor-pointer group"
                   onClick={() => onEditImage && onEditImage('certificationImage')}
                >
                   <motion.img 
                    src={config?.certificationImage || "https://images.unsplash.com/photo-1513519245088-0e12902e15cb?auto=format&fit=crop&q=80&w=800"} 
                    className="w-full h-full object-cover rounded-[56px]" 
                    referrerPolicy="no-referrer" 
                    alt="자격증 취득 공예치료사 자격 과정 실습"
                    loading="lazy"
                    decoding="async"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                   />
                   {onEditImage && (
                    <div className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm">
                      <ImageIcon size={20} />
                      <span className="sm:inline hidden">사진 변경</span>
                    </div>
                   )}
                </motion.div>
            </div>
        </div>
      </div>
    </section>
  );
};

const Gallery = ({ items, isAdmin, onDelete, onEdit, onAdd, user, onLogin }: { items: any[], isAdmin: boolean, onDelete: (id: string) => void, onEdit: (item: any) => void, onAdd: () => void, user: any, onLogin: () => void }) => {
  return (
    <section id="association-gallery" className="bg-white py-24">
      <div className="section-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-6">
          <div className="text-left">
            <h2 className="h2-title">협회 활동</h2>
          </div>
          <button 
            onClick={user ? (isAdmin ? onAdd : () => alert('관리자 권한이 필요합니다.')) : onLogin}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>활동 사진 추가</span>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((img, i) => (
            <motion.div 
              key={img.id || i} 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="aspect-square rounded-2xl overflow-hidden cursor-pointer relative group bg-slate-100"
              onClick={() => isAdmin && onEdit(img)}
            >
               <motion.img 
                 src={img.src || undefined} 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer" 
                 alt={`${img.title || "한국공예치료사협회"} - 공예치료 활동 사진`}
                 loading="lazy"
                 decoding="async"
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                 whileHover={{ scale: 1.1 }}
               />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white font-bold border-2 border-white px-4 py-2">{img.title}</span>
                  {isAdmin && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white">
                      클릭하여 수정
                    </div>
                  )}
               </div>
               {isAdmin && img.id && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onDelete(img.id); }}
                   className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                 >
                   <Trash2 size={16} />
                 </button>
               )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const NoticeDetailModal = ({ 
  isOpen, 
  onClose, 
  notice 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  notice: any; 
}) => {
  if (!isOpen || !notice) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <span className="text-primary bg-primary/10 px-3 py-1 rounded-lg text-xs font-bold">{notice.badge}</span>
            <span className="text-slate-400 font-medium text-sm">{notice.date}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-100 pb-6 break-keep">{notice.title}</h3>
        
        <div className="text-slate-700 leading-loose whitespace-pre-wrap min-h-[200px] break-keep">
          {notice.content || "상세 내용이 없습니다."}
        </div>
        
        <div className="mt-12 flex justify-center">
          <button 
            onClick={onClose}
            className="px-12 py-4 rounded-2xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
          >
            목록으로 돌아가기
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AdminViewApplicationsModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadApps();
    }
  }, [isOpen]);

  const loadApps = async () => {
    setLoading(true);
    const data = await getApplications();
    setApps(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("이 신청 내역을 삭제하시겠습니까?")) {
      await deleteApplication(id);
      loadApps();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-4xl shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">신청 현황 관리</h3>
            <p className="text-slate-400 mt-2 font-medium">실시간으로 접수된 교육 신청 목록입니다.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full"><X size={28} /></button>
        </div>
        
        {loading ? (
          <div className="py-20 text-center text-slate-400">데이터를 불러오는 중...</div>
        ) : apps.length === 0 ? (
          <div className="py-20 text-center text-slate-400">접수된 신청 내역이 없습니다.</div>
        ) : (
          <div className="space-y-4">
            {apps.map((app) => (
              <div key={app.id} className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:border-primary/20 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold mb-2 inline-block">
                      {app.program}
                    </span>
                    <h4 className="text-xl font-bold text-slate-800">{app.name}</h4>
                  </div>
                  <button 
                    onClick={() => handleDelete(app.id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-primary" /> {app.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-primary" /> {app.email || "미입력"}
                  </div>
                </div>
                {app.message && (
                  <div className="bg-white p-4 rounded-2xl text-sm text-slate-600 leading-relaxed border border-slate-100 italic">
                    "{app.message}"
                  </div>
                )}
                <div className="mt-4 text-[10px] text-slate-300 font-mono">
                  접수일시: {app.createdAt?.toDate ? app.createdAt.toDate().toLocaleString() : '정보 없음'}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};
const ApplicationFormModal = ({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    program: '자격증 과정',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("이름과 연락처는 필수입력 항목입니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addApplication(formData);
      alert("신청이 성공적으로 완료되었습니다. 곧 담당자가 연락드리겠습니다.");
      onClose();
      setFormData({ name: '', phone: '', email: '', program: '자격증 과정', message: '' });
    } catch (err) {
      alert("신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] p-8 md:p-12 w-full max-w-xl shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">교육 신청하기</h3>
            <p className="text-slate-400 mt-2 font-medium">손끝으로 전하는 따뜻한 치유의 시작</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full"><X size={28} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 ml-1">이름 *</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="홍길동"
                className="form-input w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 ml-1">연락처 *</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="010-0000-0000"
                className="form-input w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-1">이메일 주소</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="example@email.com"
              className="form-input w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-1">관심 교육 과정</label>
            <select 
              value={formData.program}
              onChange={(e) => setFormData({...formData, program: e.target.value})}
              className="form-input w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary appearance-none transition-all"
            >
              <option>자격증 과정</option>
              <option>성인 힐링 클래스</option>
              <option>노인 대상 치유</option>
              <option>아동 창의 공예</option>
              <option>기업/기관 단체 출강</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 ml-1">문의 및 신청 내용</label>
            <textarea 
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder="기타 궁금하신 점이나 구체적인 신청 내용을 적어주세요."
              className="form-input w-full bg-slate-50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-[24px] font-black text-xl text-white shadow-xl transition-all shadow-primary/20 ${isSubmitting ? 'bg-slate-300' : 'bg-primary hover:bg-primary-dark hover:scale-[1.02]'}`}
          >
            {isSubmitting ? '전송 중...' : '신청서 제출하기'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Notice = ({ 
  notices, 
  isAdmin, 
  onDelete, 
  onEdit,
  onAdd,
  onSelect 
}: { 
  notices: any[], 
  isAdmin: boolean, 
  onDelete: (id: string) => void,
  onEdit: (notice: any) => void,
  onAdd: () => void,
  onSelect: (notice: any) => void
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayedNotices = showAll ? notices : notices.slice(0, 3);

  return (
    <section id="notice" className="bg-slate-50 py-24">
      <div className="section-container">
        <div className="max-w-4xl mx-auto shadow-2xl bg-white rounded-[40px] overflow-hidden transition-all duration-500">
            <div className="bg-primary p-6 sm:p-10 flex flex-wrap justify-between items-center text-white gap-4">
                <div className="flex items-center gap-2 sm:gap-6">
                  <h2 className="text-2xl sm:text-3xl font-bold whitespace-nowrap">공지사항</h2>
                  {isAdmin ? (
                    <button 
                      onClick={onAdd}
                      className="bg-white text-primary hover:bg-white/90 px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-black shadow-lg"
                    >
                      <Plus size={20} />
                      <span>새 공지 등록</span>
                    </button>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2 text-white/60 text-xs font-medium bg-black/10 px-3 py-1.5 rounded-full">
                      <ClipboardList size={14} />
                      <span>협회 소식 및 안내</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center gap-2 text-sm font-black bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all"
                >
                    {showAll ? '접기' : '전체보기'} <ChevronRight size={16} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
                </button>
            </div>
            <div className="p-6 md:p-10 divide-y divide-slate-100">
                {displayedNotices.length > 0 ? displayedNotices.map((item, idx) => (
                    <div 
                      key={item.id || idx} 
                      className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group cursor-pointer"
                      onClick={() => onSelect(item)}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-primary bg-primary/10 px-3 py-1 rounded-lg text-xs font-bold">{item.badge}</span>
                            <h4 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors break-keep">{item.title}</h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-slate-400 font-medium text-sm">{item.date}</span>
                          {isAdmin && (
                            <div className="flex gap-1">
                               <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                title="수정"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  onDelete(item.id || item.title); 
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="삭제"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                    </div>
                )) : (
                  <div className="py-20 text-center text-slate-400 font-medium">등록된 공지사항이 없습니다.</div>
                )}
            </div>
        </div>
      </div>
    </section>
  );
};

const Mission = ({ config, onEditImage }: { config: any, onEditImage: (field: string) => void }) => {
  return (
    <section id="mission" className="bg-[#004D40] py-24 text-white overflow-hidden">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative group">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className={`aspect-[4/3] rounded-[48px] overflow-hidden shadow-2xl relative ${onEditImage ? 'cursor-pointer' : ''}`}
              onClick={() => onEditImage && onEditImage('missionImage')}
            >
               <motion.img 
                 src={config?.missionImage || "https://images.unsplash.com/photo-1544411047-c491e34a2450?auto=format&fit=crop&q=80&w=800"} 
                 className="w-full h-full object-cover" 
                 referrerPolicy="no-referrer" 
                 alt="협회 소개 사진"
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               />
               {onEditImage && (
                  <div className="absolute bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon size={20} />
                    <span>사진 변경</span>
                  </div>
               )}
            </motion.div>
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 blur-3xl -z-10" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-secondary font-bold mb-4 tracking-widest text-sm uppercase">About Us</h2>
            <h3 className="text-3xl md:text-5xl font-black mb-8 leading-tight break-keep">
              협회 소개
            </h3>
            <p className="text-lg text-white/80 mb-12 leading-relaxed break-keep">
              한국공예치료사 협회는 공예를 통해 사람의 마음을 돌보고, 삶의 온기를 회복하는 치유의 시간을 만들어갑니다.
            </p>
            
            <div className="space-y-4">
              {[
                "공예치료 전문 인재 양성",
                "감정회복 중심 프로그램 개발",
                "아동 성인 노인대상 치유프로그램 연구",
                "지역 사회 정서회복 활동",
                "한국형 공예치료 콘텐츠 개발"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  <p className="font-medium text-white/90 text-lg break-keep">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Contact = ({ config, onEditImage }: { config: any, onEditImage?: (field: string) => void }) => {
  return (
    <section id="contact" className="bg-slate-50 py-24">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-slate-900 tracking-tight break-keep">문의 & 상담</h2>
              <p className="text-lg text-slate-500 mb-12 leading-relaxed break-keep">
                궁금하신 점이 있다면 편하게 연락주세요.<br />
                전문 담당자가 친절하게 안내해 드립니다.
              </p>
              
              <div className="space-y-6">
                 <div className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                       <Phone size={28} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">전화</p>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-black text-slate-900">010-2440-7666</p>
                        <span className="text-sm text-slate-400 font-medium">(문자전용)</span>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-6 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                       <Mail size={28} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-bold mb-1">이메일</p>
                      <p className="text-xl font-bold text-slate-800">nanalaa@naver.com</p>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-8">
                    <a 
                      href="https://blog.naver.com/sewingtherapy" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-primary transition-all shadow-sm"
                      title="네이버 블로그"
                    >
                        <BookOpen size={24} />
                    </a>
                    <a 
                      href="https://www.instagram.com/korea_hand_healing_art?igsh=cDl0cGFkN2twd2l6" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-600 hover:text-primary transition-all shadow-sm"
                      title="인스타그램"
                    >
                        <Instagram size={24} />
                    </a>
                 </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative group"
            >
               <div className="aspect-square bg-white p-4 rounded-[64px] shadow-2xl relative overflow-hidden">
                  <div className="w-full h-full rounded-[48px] overflow-hidden relative">
                    <motion.img 
                      src={config?.contactImage || "https://images.unsplash.com/photo-1544411047-c491e34a2450?auto=format&fit=crop&q=80&w=800"} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                      alt="공예치료 교육 상담 및 문의 안내"
                      loading="lazy"
                      decoding="async"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {onEditImage && (
                      <div 
                        onClick={() => onEditImage('contactImage')}
                        className="absolute bottom-6 right-6 bg-[#004D40] text-white px-4 py-2 rounded-full shadow-2xl cursor-pointer flex items-center gap-2 font-bold text-xs"
                      >
                        <ImageIcon size={16} />
                        <span>메인 사진 변경</span>
                      </div>
                    )}
                  </div>
               </div>
               {/* Decorative floating balls */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl -z-10" />
            </motion.div>
        </div>
      </div>
    </section>
  );
};

const MaterialBanner = () => {
  return (
    <div className="bg-primary py-8 sm:py-12 border-t border-white/20 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full bg-black/5 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center text-white gap-8">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ShoppingBag className="text-yellow-400" size={32} />
            </div>
            <div>
              <p className="font-black text-2xl mb-1 tracking-tight">K-Hand 전용 쇼핑몰 OPEN</p>
              <p className="text-white/70 font-medium break-keep">협회가 검증한 고퀄리티 공예 재료와 키트를 만나보세요.</p>
            </div>
        </div>
        <a 
          href="https://mkt.shopping.naver.com/link/6878ed78af62921b08b9bd2c"
          target="_blank"
          rel="noreferrer"
          className="bg-white text-primary px-12 py-5 rounded-2xl font-black text-lg flex items-center gap-3 hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl"
        >
          쇼핑몰 바로가기 <ExternalLink size={24} />
        </a>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Edit States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isAdminViewModalOpen, setIsAdminViewModalOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<{ field: string, title: string, value: any, isProgram?: boolean } | null>(null);

  useEffect(() => {
    console.log("App loaded - K-Hand Association - Production Mode");
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // Hardcoded admin for simplicity as requested/typical for these applets
      setIsAdmin(u?.email === 'rahjinsun76@gmail.com');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [n, g, c] = await Promise.all([getNotices(), getGallery(), getMainConfig()]);
        setNotices(n.length > 0 ? n : DEFAULT_NOTICES);
        setGallery(g.length > 0 ? g : DEFAULT_GALLERY);
        if (c) setConfig(c);
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleAddNotice = () => {
    setEditTarget({ 
      field: 'newNotice', 
      title: "공지사항 추가 (제목|배지|상세내용)", 
      value: "",
      isNotice: true
    } as any);
    setIsEditModalOpen(true);
  };

  const handleAddGalleryItem = () => {
    setEditTarget({ 
      field: 'newGallery', 
      title: "갤러리 추가 (제목|카테고리|이미지URL)", 
      value: "",
      isGallery: true
    } as any);
    setIsEditModalOpen(true);
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm("정말 이 공지를 삭제하시겠습니까?")) {
      try {
        // Only call deleteNotice if it's a Firestore document ID (usually 20 chars)
        if (id && id.length > 10) {
          await deleteNotice(id);
        }
        // Always update local state to reflect deletion
        setNotices(prev => prev.filter(n => (n.id || n.title) !== id));
      } catch (err) {
        console.error("Failed to delete notice", err);
        alert("삭제에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (confirm("정말 이 이미지를 삭제하시겠습니까?")) {
      await deleteGalleryItem(id);
      const g = await getGallery();
      setGallery(g);
    }
  };

  const handleEditConfigImage = (field: string) => {
    setEditTarget({ 
      field, 
      title: "이미지 변경", 
      value: config?.[field] || "" 
    });
    setIsEditModalOpen(true);
  };

  const handleEditProgramImage = (id: number) => {
    setEditTarget({ 
      field: id.toString(), 
      title: `${id}번 프로그램 이미지 변경`, 
      value: config?.programImages?.[id] || "",
      isProgram: true
    });
    setIsEditModalOpen(true);
  };

  const handleEditNotice = (notice: any) => {
    setEditTarget({
      field: notice.id,
      title: "공지사항 수정",
      value: {
        title: notice.title,
        badge: notice.badge,
        content: notice.content || ""
      },
      isNotice: true
    } as any);
    setIsEditModalOpen(true);
  };

  const handleAddGallery = () => {
    setEditTarget({
      field: 'new',
      title: '새 활동 사진 추가',
      value: '',
      isGallery: true
    });
    setIsEditModalOpen(true);
  };

  const handleEditGallery = (item: any) => {
    setEditTarget({
      field: item.id || 'dynamic-new', // Use a special marker if it's a default item being "edited"
      title: '협회 활동 사진 수정',
      value: item.src,
      item: item,
      isGallery: true
    });
    setIsEditModalOpen(true);
  };

  const saveEdit = async (data: any) => {
    if (!editTarget) return;
    
    if ((editTarget as any).isGallery) {
      if (editTarget.field === 'new' || editTarget.field === 'dynamic-new') {
        await addGalleryItem({ src: data, title: '협회 활동', category: '전체' });
      } else if (editTarget.field) {
        await updateGalleryItem(editTarget.field, { src: data });
      }
      const g = await getGallery();
      setGallery(g.length > 0 ? g : DEFAULT_GALLERY);
    } else if ((editTarget as any).isNotice) {
      const { title, badge, content } = data;
      if (!title || !badge) {
        alert("제목과 배지는 필수 항목입니다.");
        return;
      }
      
      try {
        if (editTarget.field === 'newNotice') {
          const date = new Date().toISOString().split('T')[0].replace(/-/g, '.');
          await addNotice({ title, date, badge, content: content || "" });
        } else {
          await updateNotice(editTarget.field, { title, badge, content: content || "" });
        }
        const n = await getNotices();
        setNotices(n.length > 0 ? n : DEFAULT_NOTICES);
      } catch (err) {
        alert("저장에 실패했습니다. 관리자 권한을 확인해주세요.");
        console.error(err);
      }
    } else {
      let newConfig;
      if (editTarget.isProgram) {
        const programImages = { ...(config?.programImages || {}) };
        programImages[editTarget.field] = data;
        newConfig = { ...config, programImages };
      } else {
        newConfig = { ...config, [editTarget.field]: data };
      }
      await updateMainConfig(newConfig);
      setConfig(newConfig);
    }
    setIsEditModalOpen(false);
  };

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <Navbar 
        user={user} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
        isAdmin={isAdmin}
        onOpenAdminView={() => setIsAdminViewModalOpen(true)}
      />
      
      {/* Mobile-Friendly Main Content Area */}
      <main className="flex-grow">
        <Hero config={config} onEditImage={isAdmin ? handleEditConfigImage : undefined as any} />
        <Mission config={config} onEditImage={isAdmin ? handleEditConfigImage : undefined as any} />
        <About config={config} onEditImage={isAdmin ? handleEditConfigImage : undefined as any} />
        <Programs config={config} onEditProgramImage={isAdmin ? handleEditProgramImage : undefined as any} />
        <Certification 
          config={config} 
          onEditImage={isAdmin ? handleEditConfigImage : undefined as any} 
          onOpenApply={() => setIsApplyModalOpen(true)}
          isAdmin={isAdmin}
          onOpenAdminView={() => setIsAdminViewModalOpen(true)}
        />
        <Gallery 
          items={gallery} 
          isAdmin={isAdmin} 
          onDelete={handleDeleteGalleryItem} 
          onEdit={handleEditGallery}
          onAdd={handleAddGallery}
          user={user}
          onLogin={handleLogin}
        />
        <Notice 
          notices={notices} 
          isAdmin={isAdmin} 
          onDelete={handleDeleteNotice} 
          onEdit={handleEditNotice}
          onAdd={handleAddNotice}
          onSelect={(notice) => {
            setSelectedNotice(notice);
            setIsDetailModalOpen(true);
          }}
        />
        <MaterialBanner />
        <Contact config={config} onEditImage={isAdmin ? handleEditConfigImage : undefined} />
      </main>
      
      <footer className="bg-slate-950 text-white py-20">
        <div className="section-container !py-0">
           <div className="grid md:grid-cols-3 gap-16 mb-16">
              <div>
                <h2 className="text-2xl font-black tracking-tighter mb-4">K-Hand</h2>
                <p className="text-slate-500 leading-relaxed max-w-xs break-keep">
                    한국공예치료사 협회는 공예를 통해 사람의 마음을 치유하고 더 나은 삶을 만드는 전문가 집단입니다.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 md:col-span-2">
                 <div>
                    <h5 className="font-bold mb-6 text-primary">Quick Links</h5>
                    <ul className="space-y-4 text-slate-400 font-medium">
                        <li><a href="#mission" className="hover:text-white transition-colors">협회소개</a></li>
                        <li><a href="#about" className="hover:text-white transition-colors">공예치료</a></li>
                        <li><a href="#programs" className="hover:text-white transition-colors">프로그램</a></li>
                        <li><a href="#certification" className="hover:text-white transition-colors">자격증과정</a></li>
                    </ul>
                 </div>
                 <div>
                    <h5 className="font-bold mb-6 text-primary">Support</h5>
                    <ul className="space-y-4 text-slate-400 font-medium">
                        <li><a href="#notice" className="hover:text-white transition-colors">공지사항</a></li>
                        <li><a href="#contact" className="hover:text-white transition-colors">문의하기</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
                        <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
                    </ul>
                 </div>
              </div>
           </div>
           
           <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-600 text-sm font-bold">
             <p>© 2026 한국공예치료사 협회 K-Hand. All rights reserved.</p>
             <div className="flex gap-6">
                <a href="https://blog.naver.com/sewingtherapy" target="_blank" rel="noreferrer" title="네이버 블로그"><BookOpen size={20} /></a>
                <a href="https://www.instagram.com/korea_hand_healing_art?igsh=cDl0cGFkN2twd2l6" target="_blank" rel="noreferrer" title="인스타그램"><Instagram size={20} /></a>
             </div>
           </div>
        </div>
      </footer>

      <NoticeDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        notice={selectedNotice}
      />

      <ApplicationFormModal 
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />

      <AdminViewApplicationsModal 
        isOpen={isAdminViewModalOpen}
        onClose={() => setIsAdminViewModalOpen(false)}
      />

      <EditModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editTarget?.title || ""}
        initialValue={editTarget?.value || ""}
        onSave={saveEdit}
        isNotice={(editTarget as any)?.isNotice}
      />
    </div>
  );
}
