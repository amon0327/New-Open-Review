import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Business,
  PersonAdd,
  Logout,
  Dashboard as DashboardIcon,
  People,
  AccountCircle,
  Phone,
  Email,
  Delete,
  HourglassEmpty,
  ContentCopy,
  CheckCircle,
  MoreVert,
  Edit as EditIcon,
  Settings,
  Palette,
  Add,
  CloudUpload as CloudUploadIcon,
  Image as ImageIcon,
  LightMode,
  DarkMode,
  Schedule,
  Cancel
} from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChromePicker } from 'react-color';
import CompanyCreationDialog from './CompanyCreationDialog';
import PartnerInvitationForm from './PartnerInvitationForm';
import { supabase } from '../lib/supabase';
import { ImageUploadService } from '../services/ImageUploadService';
import toast from 'react-hot-toast';

export default function PartnerDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);
  const [showInvitationDialog, setShowInvitationDialog] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [partnerCompanyInfo, setPartnerCompanyInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [memberTab, setMemberTab] = useState(0); // 0: メンバー, 1: 招待中

  // 紐付いている企業一覧を取得
  const fetchAffiliatedCompanies = async () => {
    try {
      setIsLoadingCompanies(true);

      // 現在のユーザーのpartner_company_idを取得
      const { data: partnerMembership, error: membershipError } = await supabase
        .from('partner_memberships')
        .select('partner_company_id, partner_company(id, company_name, primary_color, logo_light_url, logo_dark_url, logo_icon_url)')
        .eq('business_users_id', user.id)
        .single();

      if (membershipError || !partnerMembership) {
        console.error('パートナー企業情報の取得に失敗:', membershipError);
        setIsLoadingCompanies(false);
        return;
      }

      // パートナー企業情報を保存
      if (partnerMembership.partner_company) {
        const pc = partnerMembership.partner_company;
        setPartnerCompanyInfo({
          id: pc.id,
          name: pc.company_name,
          primary_color: pc.primary_color || '#5e17eb',
          logo_light_url: pc.logo_light_url,
          logo_dark_url: pc.logo_dark_url,
          logo_icon_url: pc.logo_icon_url
        });
      }

      // partner_affiliate_companiesから紐付いている企業を取得
      const { data: affiliations, error: affiliationsError } = await supabase
        .from('partner_affiliate_companies')
        .select(`
          id,
          created_at,
          companies:companies_id (
            id,
            name,
            phone_number,
            email,
            created_at,
            is_active,
            deactivation_scheduled_at
          )
        `)
        .eq('partner_company_id', partnerMembership.partner_company_id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (affiliationsError) {
        console.error('企業一覧の取得に失敗:', affiliationsError);
        setIsLoadingCompanies(false);
        return;
      }

      // companies情報を抽出
      const companiesList = affiliations
        .map(affiliation => affiliation.companies)
        .filter(company => company !== null);

      setCompanies(companiesList);
    } catch (error) {
      console.error('企業一覧取得エラー:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  // メンバーと招待を取得
  const fetchMembersAndInvitations = async () => {
    if (!partnerCompanyInfo) return;

    try {
      setIsLoadingMembers(true);

      // メンバー一覧を取得
      const { data: membersData, error: membersError } = await supabase
        .from('partner_memberships')
        .select(`
          id,
          created_at,
          role,
          business_users:business_users_id (
            id,
            name,
            email
          )
        `)
        .eq('partner_company_id', partnerCompanyInfo.id)
        .eq('is_active', true);

      if (membersError) {
        console.error('メンバー取得エラー:', membersError);
      } else {
        setMembers(membersData || []);
      }

      // 招待中のリストを取得
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('partner_user_invitations')
        .select('*')
        .eq('partner_company_id', partnerCompanyInfo.id)
        .eq('status', 'invited')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('招待取得エラー:', invitationsError);
      } else {
        setInvitations(invitationsData || []);
      }
    } catch (error) {
      console.error('メンバー・招待取得エラー:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // 招待を削除
  const handleDeleteInvitation = async (invitationId) => {
    try {
      const { error } = await supabase
        .from('partner_user_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('招待削除エラー:', error);
        toast.error('招待の削除に失敗しました');
        return;
      }

      toast.success('招待を削除しました');
      // リストを更新
      await fetchMembersAndInvitations();
    } catch (error) {
      console.error('招待削除エラー:', error);
      toast.error('招待の削除に失敗しました');
    }
  };

  // メンバーを削除
  const handleDeleteMember = async (memberId, memberName) => {
    // メンバーが1人しかいない場合は削除不可
    if (members.length <= 1) {
      toast.error('最低1人のメンバーが必要です');
      return;
    }

    if (!window.confirm(`${memberName}さんをメンバーから削除しますか？`)) {
      return;
    }

    try {
      // is_activeをfalseに設定（論理削除）
      const { error } = await supabase
        .from('partner_memberships')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) {
        console.error('メンバー削除エラー:', error);
        toast.error('メンバーの削除に失敗しました');
        return;
      }

      toast.success(`${memberName}さんをメンバーから削除しました`);
      // リストを更新
      await fetchMembersAndInvitations();
    } catch (error) {
      console.error('メンバー削除エラー:', error);
      toast.error('メンバーの削除に失敗しました');
    }
  };

  // 企業のアクティブ/非アクティブを切り替え
  const handleToggleCompanyActive = async (companyId, currentIsActive) => {
    try {
      const newIsActive = !currentIsActive;
      // 手動切り替え時はスケジュールもクリア
      const { error } = await supabase
        .from('companies')
        .update({ is_active: newIsActive, deactivation_scheduled_at: null })
        .eq('id', companyId);

      if (error) {
        console.error('企業ステータス更新エラー:', error);
        toast.error('企業ステータスの更新に失敗しました');
        return;
      }

      toast.success(newIsActive ? '企業をアクティブにしました' : '企業を非アクティブにしました');
      // ローカルステートを更新
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, is_active: newIsActive, deactivation_scheduled_at: null } : c));
    } catch (error) {
      console.error('企業ステータス更新エラー:', error);
      toast.error('企業ステータスの更新に失敗しました');
    }
  };

  // 企業カードメニュー
  const [cardMenuAnchor, setCardMenuAnchor] = useState(null);
  const [cardMenuCompany, setCardMenuCompany] = useState(null);

  const handleOpenCardMenu = (e, company) => {
    e.stopPropagation();
    setCardMenuAnchor(e.currentTarget);
    setCardMenuCompany(company);
  };

  const handleCloseCardMenu = () => {
    setCardMenuAnchor(null);
    setCardMenuCompany(null);
  };

  // 非アクティブ化スケジュールダイアログ
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleCompany, setScheduleCompany] = useState(null);
  const [scheduleDateTime, setScheduleDateTime] = useState('');

  const handleOpenScheduleDialog = (company) => {
    setScheduleCompany(company);
    // デフォルトを1時間後に設定
    const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
    const offset = defaultDate.getTimezoneOffset();
    const local = new Date(defaultDate.getTime() - offset * 60 * 1000);
    setScheduleDateTime(local.toISOString().slice(0, 16));
    setScheduleDialogOpen(true);
  };

  const handleCloseScheduleDialog = () => {
    setScheduleDialogOpen(false);
    setScheduleCompany(null);
    setScheduleDateTime('');
  };

  const handleSetSchedule = async () => {
    if (!scheduleCompany || !scheduleDateTime) return;
    const scheduledAt = new Date(scheduleDateTime);
    if (scheduledAt <= new Date()) {
      toast.error('未来の日時を指定してください');
      return;
    }
    try {
      const { error } = await supabase
        .from('companies')
        .update({ deactivation_scheduled_at: scheduledAt.toISOString() })
        .eq('id', scheduleCompany.id);

      if (error) {
        console.error('スケジュール設定エラー:', error);
        toast.error('スケジュールの設定に失敗しました');
        return;
      }

      toast.success('非アクティブ化をスケジュールしました');
      setCompanies(prev => prev.map(c =>
        c.id === scheduleCompany.id ? { ...c, deactivation_scheduled_at: scheduledAt.toISOString() } : c
      ));
      handleCloseScheduleDialog();
    } catch (error) {
      console.error('スケジュール設定エラー:', error);
      toast.error('スケジュールの設定に失敗しました');
    }
  };

  const handleCancelSchedule = async (companyId) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ deactivation_scheduled_at: null })
        .eq('id', companyId);

      if (error) {
        console.error('スケジュールキャンセルエラー:', error);
        toast.error('スケジュールのキャンセルに失敗しました');
        return;
      }

      toast.success('非アクティブ化スケジュールをキャンセルしました');
      setCompanies(prev => prev.map(c =>
        c.id === companyId ? { ...c, deactivation_scheduled_at: null } : c
      ));
    } catch (error) {
      console.error('スケジュールキャンセルエラー:', error);
      toast.error('スケジュールのキャンセルに失敗しました');
    }
  };

  // 企業編集ダイアログ
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editCompany, setEditCompany] = useState(null);
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const handleOpenEditDialog = (company) => {
    setEditCompany(company);
    setEditPhone(company.phone_number || '');
    setEditEmail(company.email || '');
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditCompany(null);
  };

  const handleSaveEdit = async () => {
    if (!editCompany) return;
    try {
      const { error } = await supabase
        .from('companies')
        .update({ phone_number: editPhone || null, email: editEmail || null })
        .eq('id', editCompany.id);

      if (error) {
        console.error('企業情報更新エラー:', error);
        toast.error('企業情報の更新に失敗しました');
        return;
      }

      toast.success('企業情報を更新しました');
      setCompanies(prev => prev.map(c =>
        c.id === editCompany.id ? { ...c, phone_number: editPhone || null, email: editEmail || null } : c
      ));
      handleCloseEditDialog();
    } catch (error) {
      console.error('企業情報更新エラー:', error);
      toast.error('企業情報の更新に失敗しました');
    }
  };

  // 企業削除の確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  const handleOpenDeleteDialog = (company) => {
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCompanyToDelete(null);
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    try {
      // partner_affiliate_companiesのis_deletedをtrueに更新（ソフトデリート）
      const { data: updatedRows, error: affiliateError } = await supabase
        .from('partner_affiliate_companies')
        .update({ is_deleted: true })
        .eq('companies_id', companyToDelete.id)
        .eq('partner_company_id', partnerCompanyInfo.id)
        .select();

      if (affiliateError) {
        console.error('企業削除エラー:', affiliateError);
        toast.error('企業の削除に失敗しました');
        handleCloseDeleteDialog();
        return;
      }

      // RLSにより0行更新の場合はエラーとして扱う
      if (!updatedRows || updatedRows.length === 0) {
        console.error('企業削除エラー: 更新対象が見つかりません（RLSポリシーの可能性）');
        toast.error('企業の削除に失敗しました。権限を確認してください。');
        handleCloseDeleteDialog();
        return;
      }

      toast.success(`${companyToDelete.name}を削除しました`);
      // DB更新成功を確認してからUIを更新し、最新データを再取得
      await fetchAffiliatedCompanies();
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('企業削除エラー:', error);
      toast.error('企業の削除に失敗しました');
      handleCloseDeleteDialog();
    }
  };

  // === テーマ設定関連 ===
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleUpdatePrimaryColor = async (color) => {
    if (!partnerCompanyInfo) return;
    try {
      const { data, error } = await supabase
        .from('partner_company')
        .update({ primary_color: color })
        .eq('id', partnerCompanyInfo.id)
        .select();

      if (error || !data || data.length === 0) {
        console.error('カラー更新エラー:', error);
        toast.error('カラーの更新に失敗しました');
        return;
      }
      setPartnerCompanyInfo(prev => ({ ...prev, primary_color: color }));
      toast.success('プライマリーカラーを更新しました');
    } catch (error) {
      console.error('カラー更新エラー:', error);
      toast.error('カラーの更新に失敗しました');
    }
  };

  const handleLogoUpload = async (file, type) => {
    if (!partnerCompanyInfo) return;
    setIsSavingSettings(true);
    try {
      const validation = ImageUploadService.validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        setIsSavingSettings(false);
        return;
      }

      const result = await ImageUploadService.uploadPartnerLogo(file, partnerCompanyInfo.id, type);
      if (!result.success) {
        toast.error('ロゴのアップロードに失敗しました');
        setIsSavingSettings(false);
        return;
      }

      const columnMap = { light: 'logo_light_url', dark: 'logo_dark_url', icon: 'logo_icon_url' };
      const column = columnMap[type];

      const { data, error } = await supabase
        .from('partner_company')
        .update({ [column]: result.data.url })
        .eq('id', partnerCompanyInfo.id)
        .select();

      if (error || !data || data.length === 0) {
        console.error('ロゴURL更新エラー:', error);
        toast.error('ロゴの保存に失敗しました');
        setIsSavingSettings(false);
        return;
      }

      setPartnerCompanyInfo(prev => ({ ...prev, [column.replace('_url', '_url')]: result.data.url }));
      const typeLabel = { light: '明るい背景用', dark: '暗い背景用', icon: 'アイコン' };
      toast.success(`${typeLabel[type]}ロゴを更新しました`);
    } catch (error) {
      console.error('ロゴアップロードエラー:', error);
      toast.error('ロゴのアップロードに失敗しました');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogoDelete = async (type) => {
    if (!partnerCompanyInfo) return;
    try {
      const columnMap = { light: 'logo_light_url', dark: 'logo_dark_url', icon: 'logo_icon_url' };
      const column = columnMap[type];
      const currentUrl = partnerCompanyInfo[column];

      if (currentUrl) {
        await ImageUploadService.deleteImage(currentUrl);
      }

      const { data, error } = await supabase
        .from('partner_company')
        .update({ [column]: null })
        .eq('id', partnerCompanyInfo.id)
        .select();

      if (error || !data || data.length === 0) {
        toast.error('ロゴの削除に失敗しました');
        return;
      }

      setPartnerCompanyInfo(prev => ({ ...prev, [column]: null }));
      toast.success('ロゴを削除しました');
    } catch (error) {
      console.error('ロゴ削除エラー:', error);
      toast.error('ロゴの削除に失敗しました');
    }
  };

  // 初回ロード時に企業一覧を取得
  useEffect(() => {
    if (user) {
      fetchAffiliatedCompanies();
    }
  }, [user]);

  // パートナー企業情報が取得できたらメンバー・招待を取得
  useEffect(() => {
    if (partnerCompanyInfo) {
      fetchMembersAndInvitations();
    }
  }, [partnerCompanyInfo]);

  // メンバータブに切り替えたときにリフレッシュ
  useEffect(() => {
    if (activeTab === 'members' && partnerCompanyInfo) {
      fetchMembersAndInvitations();
    }
  }, [activeTab]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    if (onLogout) {
      onLogout();
    }
  };

  const navigationItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: <DashboardIcon /> },
    { id: 'companies', label: '企業管理', icon: <Business /> },
    { id: 'members', label: 'メンバー招待', icon: <PersonAdd /> },
    { id: 'settings', label: '設定', icon: <Settings /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              ダッシュボード
            </Typography>

            <Grid container spacing={3}>
              {/* 統計カード */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Business sx={{ fontSize: 40, color: '#5e17eb', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {isLoadingCompanies ? '-' : companies.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          登録企業数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <CheckCircle sx={{ fontSize: 40, color: '#10b981', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {isLoadingCompanies ? '-' : companies.filter(c => c.is_active !== false).length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          アクティブ企業数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <People sx={{ fontSize: 40, color: '#3b82f6', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {isLoadingMembers ? '-' : members.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          メンバー数
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <PersonAdd sx={{ fontSize: 40, color: '#f59e0b', mr: 2 }} />
                      <Box>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c' }}>
                          {isLoadingMembers ? '-' : invitations.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          招待中
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* 登録企業数の推移 */}
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', overflow: 'hidden' }}>
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ px: 3, pt: 3, pb: 1, display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        登録企業数の推移
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                        直近6ヶ月
                      </Typography>
                    </Box>
                    {isLoadingCompanies ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#5e17eb' }} />
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: 280, pt: 2 }}>
                        <ResponsiveContainer>
                          <AreaChart
                            data={(() => {
                              const now = new Date();
                              const months = [];
                              for (let i = 5; i >= 0; i--) {
                                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                months.push({
                                  date: d,
                                  label: `${d.getMonth() + 1}月`,
                                });
                              }
                              return months.map(m => {
                                const endOfMonth = new Date(m.date.getFullYear(), m.date.getMonth() + 1, 0, 23, 59, 59);
                                const count = companies.filter(c => new Date(c.created_at) <= endOfMonth).length;
                                return { name: m.label, 企業数: count };
                              });
                            })()}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="colorCompanies" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#5e17eb" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#764ba2" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#f1f5f9" />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 500 }}
                              dy={8}
                            />
                            <YAxis
                              allowDecimals={false}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 500 }}
                              dx={-4}
                            />
                            <RechartsTooltip
                              cursor={{ stroke: '#5e17eb', strokeWidth: 1, strokeDasharray: '4 4' }}
                              contentStyle={{
                                borderRadius: 10,
                                border: 'none',
                                boxShadow: '0 8px 24px rgba(94, 23, 235, 0.15)',
                                padding: '10px 16px',
                                fontSize: 13,
                                fontWeight: 500
                              }}
                              labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
                              itemStyle={{ color: '#5e17eb' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="企業数"
                              stroke="#5e17eb"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorCompanies)"
                              dot={{ r: 4, fill: '#fff', stroke: '#5e17eb', strokeWidth: 2 }}
                              activeDot={{ r: 6, fill: '#5e17eb', stroke: '#fff', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 'companies':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                企業管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<Business />}
                onClick={() => setShowCompanyDialog(true)}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                企業アカウント作成
              </Button>
            </Box>

            {isLoadingCompanies ? (
              <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#5e17eb' }} />
                    <Typography variant="body1" sx={{ color: '#64748b', mt: 2 }}>
                      企業一覧を読み込み中...
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : companies.length === 0 ? (
              <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Business sx={{ fontSize: 80, color: '#e2e8f0', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                      登録されている企業がありません
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                      「企業アカウント作成」ボタンから新しい企業を作成してください
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {companies.map((company) => (
                  <Grid item xs={12} md={6} lg={4} key={company.id}>
                    <Card
                      onClick={() => {
                        if (company.is_active !== false) {
                          navigate(`/company/${company.id}/dashboard`);
                        }
                      }}
                      sx={{
                        borderRadius: 1.5,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s, opacity 0.2s',
                        cursor: company.is_active === false ? 'default' : 'pointer',
                        opacity: company.is_active === false ? 0.6 : 1,
                        '&:hover': company.is_active === false ? {} : {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 30px rgba(94, 23, 235, 0.15)'
                        }
                      }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Business sx={{ fontSize: 32, color: company.is_active === false ? '#94a3b8' : '#5e17eb', mr: 1.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 600, color: company.is_active === false ? '#94a3b8' : '#1a202c', flexGrow: 1 }}>
                            {company.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => handleOpenCardMenu(e, company)}
                            sx={{
                              color: '#94a3b8',
                              '&:hover': { color: '#64748b', backgroundColor: 'rgba(0,0,0,0.04)' }
                            }}
                          >
                            <MoreVert sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {company.phone_number && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Phone sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {company.phone_number}
                              </Typography>
                            </Box>
                          )}

                          {company.email && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Email sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                              <Typography variant="body2" sx={{ color: '#64748b' }}>
                                {company.email}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={`登録日: ${new Date(company.created_at).toLocaleDateString('ja-JP')}`}
                              size="small"
                              sx={{
                                bgcolor: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '0.75rem'
                              }}
                            />
                            {company.is_active === false && (
                              <Chip
                                label="非アクティブ"
                                size="small"
                                sx={{
                                  bgcolor: '#fef2f2',
                                  color: '#ef4444',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              />
                            )}
                            {company.deactivation_scheduled_at && company.is_active !== false && (
                              <Chip
                                icon={<Schedule sx={{ fontSize: 14 }} />}
                                label={`${new Date(company.deactivation_scheduled_at).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} に停止`}
                                size="small"
                                onDelete={(e) => {
                                  e.stopPropagation();
                                  handleCancelSchedule(company.id);
                                }}
                                deleteIcon={<Cancel sx={{ fontSize: 16 }} />}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  bgcolor: '#fffbeb',
                                  color: '#d97706',
                                  fontSize: '0.7rem',
                                  fontWeight: 600,
                                  '& .MuiChip-icon': { color: '#d97706' },
                                  '& .MuiChip-deleteIcon': {
                                    color: '#d97706',
                                    '&:hover': { color: '#b45309' }
                                  }
                                }}
                              />
                            )}
                            <Box sx={{ flexGrow: 1 }} />
                            <Switch
                              onClick={(e) => e.stopPropagation()}
                                checked={company.is_active !== false}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleToggleCompanyActive(company.id, company.is_active);
                                }}
                                sx={{
                                  width: 44,
                                  height: 24,
                                  p: 0,
                                  '& .MuiSwitch-switchBase': {
                                    p: '3px',
                                    '&.Mui-checked': {
                                      transform: 'translateX(20px)',
                                      color: '#fff',
                                      '& + .MuiSwitch-track': {
                                        backgroundColor: '#5e17eb',
                                        opacity: 1,
                                      },
                                    },
                                  },
                                  '& .MuiSwitch-thumb': {
                                    width: 18,
                                    height: 18,
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                                  },
                                  '& .MuiSwitch-track': {
                                    borderRadius: 12,
                                    backgroundColor: '#cbd5e1',
                                    opacity: 1,
                                    transition: 'background-color 0.3s ease',
                                  },
                                }}
                              />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );

      case 'members':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c' }}>
                メンバー管理
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setShowInvitationDialog(true)}
                disabled={!partnerCompanyInfo}
                sx={{
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                  borderRadius: 2,
                  px: 3
                }}
              >
                メンバーを招待
              </Button>
            </Box>

            <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={memberTab}
                  onChange={(e, newValue) => setMemberTab(newValue)}
                  sx={{
                    px: 2,
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem'
                    },
                    '& .Mui-selected': {
                      color: '#5e17eb'
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#5e17eb'
                    }
                  }}
                >
                  <Tab
                    label={`メンバー (${members.length})`}
                    icon={<People sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                  />
                  <Tab
                    label={`招待中 (${invitations.length})`}
                    icon={<HourglassEmpty sx={{ fontSize: 20 }} />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              <CardContent>
                {isLoadingMembers ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {/* メンバータブ */}
                    {memberTab === 0 && (
                      <>
                        {members.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <People sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              メンバーがいません
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ pt: 0 }}>
                            {members.map((member, index) => (
                              <React.Fragment key={member.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                  secondaryAction={
                                    members.length > 1 && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteMember(member.id, member.business_users?.name || '名前なし')}
                                        sx={{
                                          color: '#94a3b8',
                                          '&:hover': {
                                            color: '#ef4444',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)'
                                          }
                                        }}
                                      >
                                        <Delete sx={{ fontSize: 20 }} />
                                      </IconButton>
                                    )
                                  }
                                >
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#5e17eb' }}>
                                      {member.business_users?.name?.[0] || '?'}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={member.business_users?.name || '名前なし'}
                                    secondary={
                                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" component="span" sx={{ color: '#64748b' }}>
                                          {member.business_users?.email}
                                        </Typography>
                                        <Chip
                                          label={member.role === 'owner' ? 'オーナー' : member.role}
                                          size="small"
                                          sx={{
                                            width: 'fit-content',
                                            bgcolor: '#f1f5f9',
                                            color: '#5e17eb',
                                            fontSize: '0.75rem',
                                            height: '20px'
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              </React.Fragment>
                            ))}
                          </List>
                        )}
                      </>
                    )}

                    {/* 招待中タブ */}
                    {memberTab === 1 && (
                      <>
                        {invitations.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 8 }}>
                            <HourglassEmpty sx={{ fontSize: 60, color: '#e2e8f0', mb: 2 }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                              招待中のメンバーはいません
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ pt: 0 }}>
                            {invitations.map((invitation, index) => (
                              <React.Fragment key={invitation.id}>
                                {index > 0 && <Divider />}
                                <ListItem
                                  secondaryAction={
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<ContentCopy sx={{ fontSize: 16 }} />}
                                        onClick={() => {
                                          const url = `https://app.openreview.jp/partner-invitation/${invitation.token}`;
                                          navigator.clipboard.writeText(url);
                                          toast.success('招待URLをコピーしました');
                                        }}
                                        sx={{
                                          borderColor: '#5e17eb',
                                          color: '#5e17eb',
                                          fontSize: '0.75rem',
                                          py: 0.5,
                                          px: 1,
                                          minWidth: 'auto',
                                          '&:hover': {
                                            borderColor: '#4c1d95',
                                            backgroundColor: 'rgba(94, 23, 235, 0.05)',
                                          }
                                        }}
                                      >
                                        招待URLをコピー
                                      </Button>
                                      <IconButton
                                        size="small"
                                        aria-label="delete"
                                        onClick={() => {
                                          if (window.confirm(`${invitation.name}さんへの招待を削除しますか？`)) {
                                            handleDeleteInvitation(invitation.id);
                                          }
                                        }}
                                        sx={{ color: '#ef4444' }}
                                      >
                                        <Delete sx={{ fontSize: 20 }} />
                                      </IconButton>
                                    </Box>
                                  }
                                >
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: '#f59e0b' }}>
                                      {invitation.name?.[0] || '?'}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={invitation.name}
                                    secondary={
                                      <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                        <Typography variant="body2" component="span" sx={{ color: '#64748b' }}>
                                          招待日: {new Date(invitation.created_at).toLocaleDateString('ja-JP')}
                                        </Typography>
                                        <Chip
                                          label="招待中"
                                          size="small"
                                          sx={{
                                            width: 'fit-content',
                                            bgcolor: '#fef3c7',
                                            color: '#f59e0b',
                                            fontSize: '0.75rem',
                                            height: '20px'
                                          }}
                                        />
                                      </Box>
                                    }
                                  />
                                </ListItem>
                              </React.Fragment>
                            ))}
                          </List>
                        )}
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        );

      case 'settings':
        return (
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: '#1a202c' }}>
              設定
            </Typography>

            {/* プライマリーカラー設定 */}
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2
                }}>
                  <Palette sx={{ color: 'white', fontSize: '1.2rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>プライマリーカラー</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>パートナー企業のブランドカラーを設定</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {[
                  { name: '紫', value: '#5e17eb' },
                  { name: '青', value: '#3b82f6' },
                  { name: '緑', value: '#10b981' },
                  { name: '赤', value: '#ef4444' },
                  { name: 'オレンジ', value: '#f59e0b' },
                  { name: 'ピンク', value: '#ec4899' }
                ].map((color) => (
                  <motion.div key={color.value} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                    <Box
                      onClick={() => handleUpdatePrimaryColor(color.value)}
                      sx={{
                        width: 40, height: 40, borderRadius: '50%',
                        backgroundColor: color.value, cursor: 'pointer',
                        border: partnerCompanyInfo?.primary_color === color.value ? '3px solid #1e293b' : '2px solid transparent',
                        boxShadow: partnerCompanyInfo?.primary_color === color.value
                          ? `0 0 0 2px white, 0 0 0 4px ${color.value}` : '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                      }}
                    />
                  </motion.div>
                ))}

                {/* カスタムカラー */}
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                  <Box
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    sx={{
                      width: 40, height: 40, borderRadius: '50%',
                      background: !['#5e17eb','#3b82f6','#10b981','#ef4444','#f59e0b','#ec4899'].includes(partnerCompanyInfo?.primary_color)
                        ? partnerCompanyInfo?.primary_color : '#e5e7eb',
                      cursor: 'pointer',
                      border: showColorPicker ? '3px solid #1e293b' : '2px solid transparent',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                    }}
                  >
                    {['#5e17eb','#3b82f6','#10b981','#ef4444','#f59e0b','#ec4899'].includes(partnerCompanyInfo?.primary_color || '#5e17eb') && (
                      <Add sx={{ color: '#6b7280', fontSize: '1.2rem' }} />
                    )}
                  </Box>
                </motion.div>

                {/* 現在のカラー表示 */}
                <Typography variant="body2" sx={{ color: '#64748b', ml: 1 }}>
                  {partnerCompanyInfo?.primary_color || '#5e17eb'}
                </Typography>
              </Box>

              {showColorPicker && (
                <Box sx={{ mt: 3, position: 'relative' }}>
                  <Box
                    sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                    onClick={() => setShowColorPicker(false)}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1000 }}>
                    <ChromePicker
                      color={partnerCompanyInfo?.primary_color || '#5e17eb'}
                      onChangeComplete={(color) => handleUpdatePrimaryColor(color.hex)}
                      disableAlpha={true}
                    />
                  </Box>
                </Box>
              )}
            </Card>

            {/* ロゴ設定 */}
            <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2
                }}>
                  <ImageIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>ロゴ画像</Typography>
                  <Typography variant="body2" sx={{ color: '#64748b' }}>背景に応じた3種類のロゴを設定</Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                {/* 明るい背景用ロゴ */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <LightMode sx={{ fontSize: 18, color: '#f59e0b' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                        明るい背景用ロゴ
                      </Typography>
                    </Box>
                    <Card sx={{
                      borderRadius: 2, overflow: 'hidden', mb: 1.5,
                      backgroundColor: '#ffffff', border: '1px solid #e5e7eb',
                      minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {partnerCompanyInfo?.logo_light_url ? (
                        <Box component="img" src={partnerCompanyInfo.logo_light_url} alt="明るい背景用ロゴ"
                          sx={{ maxWidth: '80%', maxHeight: 80, objectFit: 'contain', p: 2 }} />
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                          <ImageIcon sx={{ fontSize: 32, color: '#d1d5db', mb: 0.5 }} />
                          <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>未設定</Typography>
                        </Box>
                      )}
                    </Card>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} component="label"
                        disabled={isSavingSettings}
                        sx={{ backgroundColor: '#5E17EB', '&:hover': { backgroundColor: '#4C1D95' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                        アップロード
                        <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0], 'light')} />
                      </Button>
                      {partnerCompanyInfo?.logo_light_url && (
                        <Button variant="outlined" size="small" onClick={() => handleLogoDelete('light')}
                          sx={{ borderColor: '#DC2626', color: '#DC2626', '&:hover': { borderColor: '#B91C1C', backgroundColor: 'rgba(220,38,38,0.04)' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                          削除
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* 暗い背景用ロゴ */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <DarkMode sx={{ fontSize: 18, color: '#6366f1' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                        暗い背景用ロゴ
                      </Typography>
                    </Box>
                    <Card sx={{
                      borderRadius: 2, overflow: 'hidden', mb: 1.5,
                      backgroundColor: '#1e293b', border: '1px solid #334155',
                      minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {partnerCompanyInfo?.logo_dark_url ? (
                        <Box component="img" src={partnerCompanyInfo.logo_dark_url} alt="暗い背景用ロゴ"
                          sx={{ maxWidth: '80%', maxHeight: 80, objectFit: 'contain', p: 2 }} />
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                          <ImageIcon sx={{ fontSize: 32, color: '#475569', mb: 0.5 }} />
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>未設定</Typography>
                        </Box>
                      )}
                    </Card>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} component="label"
                        disabled={isSavingSettings}
                        sx={{ backgroundColor: '#5E17EB', '&:hover': { backgroundColor: '#4C1D95' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                        アップロード
                        <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0], 'dark')} />
                      </Button>
                      {partnerCompanyInfo?.logo_dark_url && (
                        <Button variant="outlined" size="small" onClick={() => handleLogoDelete('dark')}
                          sx={{ borderColor: '#DC2626', color: '#DC2626', '&:hover': { borderColor: '#B91C1C', backgroundColor: 'rgba(220,38,38,0.04)' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                          削除
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* アイコンロゴ */}
                <Grid item xs={12} md={4}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Palette sx={{ fontSize: 18, color: '#10b981' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151' }}>
                        アイコンロゴ
                      </Typography>
                    </Box>
                    <Card sx={{
                      borderRadius: 2, overflow: 'hidden', mb: 1.5,
                      backgroundColor: '#f8fafc', border: '1px solid #e5e7eb',
                      minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {partnerCompanyInfo?.logo_icon_url ? (
                        <Box component="img" src={partnerCompanyInfo.logo_icon_url} alt="アイコンロゴ"
                          sx={{ width: 64, height: 64, objectFit: 'contain', p: 1 }} />
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                          <ImageIcon sx={{ fontSize: 32, color: '#d1d5db', mb: 0.5 }} />
                          <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block' }}>未設定</Typography>
                        </Box>
                      )}
                    </Card>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" size="small" startIcon={<CloudUploadIcon />} component="label"
                        disabled={isSavingSettings}
                        sx={{ backgroundColor: '#5E17EB', '&:hover': { backgroundColor: '#4C1D95' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                        アップロード
                        <input type="file" hidden accept="image/jpeg,image/png,image/webp,image/svg+xml"
                          onChange={(e) => e.target.files[0] && handleLogoUpload(e.target.files[0], 'icon')} />
                      </Button>
                      {partnerCompanyInfo?.logo_icon_url && (
                        <Button variant="outlined" size="small" onClick={() => handleLogoDelete('icon')}
                          sx={{ borderColor: '#DC2626', color: '#DC2626', '&:hover': { borderColor: '#B91C1C', backgroundColor: 'rgba(220,38,38,0.04)' }, fontSize: '0.75rem', px: 2, py: 0.5 }}>
                          削除
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, display: 'block' }}>
                推奨: PNG形式、5MB以下。明るい背景用は暗い色のロゴ、暗い背景用は明るい色のロゴを使用してください。アイコンは正方形推奨。
              </Typography>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  const handleCompanyCreated = async (company) => {
    setShowCompanyDialog(false);
    // 企業一覧を再取得して最新の状態を表示
    await fetchAffiliatedCompanies();
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* 企業作成ダイアログ */}
      <CompanyCreationDialog
        open={showCompanyDialog}
        onClose={() => setShowCompanyDialog(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* 企業カードメニュー */}
      <Menu
        anchorEl={cardMenuAnchor}
        open={Boolean(cardMenuAnchor)}
        onClose={handleCloseCardMenu}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem
          onClick={() => {
            const company = cardMenuCompany;
            handleCloseCardMenu();
            if (company) handleOpenEditDialog(company);
          }}
          sx={{ gap: 1.5, py: 1.5 }}
        >
          <EditIcon sx={{ fontSize: 20, color: '#64748b' }} />
          編集
        </MenuItem>
        {cardMenuCompany?.is_active !== false && (
          <MenuItem
            onClick={() => {
              const company = cardMenuCompany;
              handleCloseCardMenu();
              if (company) handleOpenScheduleDialog(company);
            }}
            sx={{ gap: 1.5, py: 1.5 }}
          >
            <Schedule sx={{ fontSize: 20, color: '#f59e0b' }} />
            非アクティブ化スケジュール
          </MenuItem>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            const company = cardMenuCompany;
            handleCloseCardMenu();
            if (company) handleOpenDeleteDialog(company);
          }}
          sx={{ color: '#ef4444', gap: 1.5, py: 1.5 }}
        >
          <Delete sx={{ fontSize: 20 }} />
          削除
        </MenuItem>
      </Menu>

      {/* 企業編集ダイアログ */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 420, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          企業情報の編集
        </DialogTitle>
        <DialogContent>
          <TextField
            label="会社名"
            value={editCompany?.name || ''}
            fullWidth
            disabled
            sx={{ mt: 1, mb: 2 }}
            size="small"
          />
          <TextField
            label="電話番号"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            size="small"
            placeholder="例: 03-1234-5678"
          />
          <TextField
            label="メールアドレス"
            value={editEmail}
            onChange={(e) => setEditEmail(e.target.value)}
            fullWidth
            size="small"
            placeholder="例: info@example.com"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleCloseEditDialog}
            sx={{ color: '#64748b', borderRadius: 2 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
              borderRadius: 2
            }}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 企業削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 380,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          企業の削除
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569' }}>
            <strong>{companyToDelete?.name}</strong> を削除しますか？この操作は取り消せません。企業に紐づくデータも削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleCloseDeleteDialog}
            sx={{ color: '#64748b', borderRadius: 2 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleDeleteCompany}
            variant="contained"
            sx={{
              bgcolor: '#ef4444',
              borderRadius: 2,
              '&:hover': { bgcolor: '#dc2626' }
            }}
          >
            削除する
          </Button>
        </DialogActions>
      </Dialog>

      {/* 非アクティブ化スケジュールダイアログ */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={handleCloseScheduleDialog}
        PaperProps={{
          sx: { borderRadius: 2, minWidth: 420, p: 1 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          非アクティブ化スケジュール
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#475569', mb: 2 }}>
            <strong>{scheduleCompany?.name}</strong> を指定日時に自動で非アクティブにします。
          </DialogContentText>
          <TextField
            label="非アクティブ化日時"
            type="datetime-local"
            value={scheduleDateTime}
            onChange={(e) => setScheduleDateTime(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleCloseScheduleDialog}
            sx={{ color: '#64748b', borderRadius: 2 }}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleSetSchedule}
            variant="contained"
            disabled={!scheduleDateTime}
            sx={{
              background: 'linear-gradient(45deg, #f59e0b 30%, #d97706 90%)',
              borderRadius: 2,
              '&:hover': { background: 'linear-gradient(45deg, #d97706 30%, #b45309 90%)' }
            }}
          >
            スケジュール設定
          </Button>
        </DialogActions>
      </Dialog>

      {/* メンバー招待ダイアログ */}
      {showInvitationDialog && partnerCompanyInfo && (
        <PartnerInvitationForm
          partnerCompanyId={partnerCompanyInfo.id}
          partnerCompanyName={partnerCompanyInfo.name}
          onClose={() => setShowInvitationDialog(false)}
          onInvitationSent={() => {
            // 招待リストを更新
            fetchMembersAndInvitations();
          }}
        />
      )}

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          borderRadius: 0,
          color: '#1a202c'
        }}
      >
        <Toolbar>
          <img
            src="https://otfreskkeaenahqziriz.supabase.co/storage/v1/object/public/app-assets/logo/OpenReviewLogo.png"
            alt="OpenReview"
            style={{ width: 32, height: 32, objectFit: 'contain', marginRight: 12 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Partner Dashboard
          </Typography>

          <IconButton onClick={handleMenuOpen}>
            <Avatar sx={{ bgcolor: '#5e17eb' }}>
              {user?.user_metadata?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: { borderRadius: 2, minWidth: 200 }
            }}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.user_metadata?.name || 'ユーザー'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {user?.email}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ display: 'flex', pt: 8 }}>
        {/* Sidebar */}
        <Paper
          elevation={0}
          sx={{
            width: 280,
            height: 'calc(100vh - 64px)',
            position: 'fixed',
            borderRight: '1px solid #e2e8f0',
            borderRadius: 0,
            background: '#ffffff'
          }}
        >
          <List sx={{ pt: 3 }}>
            {navigationItems.map((item) => (
              <ListItem key={item.id} disablePadding sx={{ px: 2 }}>
                <ListItemButton
                  selected={activeTab === item.id}
                  onClick={() => setActiveTab(item.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&.Mui-selected': {
                      background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      color: '#ffffff',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#ffffff'
                      }
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: activeTab === item.id ? '#ffffff' : '#64748b' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Content Area */}
        <Box sx={{ flexGrow: 1, ml: '280px', p: 4 }}>
          <Container maxWidth="xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
