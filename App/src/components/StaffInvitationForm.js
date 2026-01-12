import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  PersonAdd,
  Close,
  Add,
  Delete,
  Send,
  ContentCopy,
  Check,
  Error as ErrorIcon,
  ContentPaste
} from '@mui/icons-material';
import { supabase } from '../lib/supabase';

export default function StaffInvitationForm({
  storeId,
  storeName,
  onClose,
  onInvitationSent
}) {
  // 初期状態：5行の空の入力欄
  const createEmptyRow = () => ({ name: '', role: 'STAFF', status: null, result: null });

  const [rows, setRows] = useState([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow()
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [urlType, setUrlType] = useState('production'); // 'production' or 'development'

  const handleInputChange = (index, field) => (event) => {
    const newRows = [...rows];
    newRows[index][field] = event.target.value;
    setRows(newRows);
    if (error) setError(null);
  };

  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      const newRows = rows.filter((_, i) => i !== index);
      setRows(newRows);
    }
  };

  // スプレッドシートからのペースト処理
  const handlePasteData = (text) => {
    if (!text.trim()) return;

    const lines = text.trim().split('\n');
    const newRows = [];

    for (const line of lines) {
      // タブまたはカンマで分割
      const parts = line.split(/\t|,/).map(p => p.trim());

      if (parts.length >= 1 && parts[0]) {
        const name = parts[0];
        let role = 'STAFF';

        // 2列目がある場合、ロールを判定
        if (parts.length >= 2) {
          const roleText = parts[1].toUpperCase();
          if (roleText === 'STORE' || roleText === '店舗管理者' || roleText === '管理者') {
            role = 'STORE';
          }
        }

        newRows.push({
          name,
          role,
          status: null,
          result: null
        });
      }
    }

    if (newRows.length > 0) {
      setRows(newRows);
      setPasteText('');
      setShowPasteArea(false);
    }
  };

  // クリップボードからペースト
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handlePasteData(text);
    } catch (err) {
      // クリップボードアクセスが拒否された場合、テキストエリアを表示
      setShowPasteArea(true);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setProgress(0);

    // 名前が入力されている行のみ抽出
    const validRows = rows.filter(row => row.name.trim());

    if (validRows.length === 0) {
      setError('少なくとも1人の名前を入力してください');
      setIsSubmitting(false);
      return;
    }

    try {
      // 認証情報の取得
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error('認証情報の取得に失敗しました。再ログインしてください。');
      }

      const newRows = [...rows];
      let successCount = 0;

      // 各行を順番に処理
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        if (!row.name.trim()) {
          continue; // 空の行はスキップ
        }

        try {
          // Edge Functionを使用して招待を作成
          const { data, error: apiError } = await supabase.functions.invoke('create-staff-invitation', {
            body: {
              storeId: storeId,
              role: row.role,
              name: row.name.trim()
            },
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });

          if (apiError || !data.success) {
            newRows[i].status = 'error';
            newRows[i].result = { error: apiError?.message || data.error || '招待の作成に失敗しました' };
          } else {
            newRows[i].status = 'success';
            newRows[i].result = data.invitation;
            successCount++;
          }
        } catch (err) {
          newRows[i].status = 'error';
          newRows[i].result = { error: err.message };
        }

        // 進捗更新
        setProgress(((i + 1) / validRows.length) * 100);
        setRows([...newRows]);
      }

      setSuccess(true);

      // 親コンポーネントに通知
      if (onInvitationSent && successCount > 0) {
        onInvitationSent();
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 送信用の形式でコピー（名前さん + URL）
  const copyForSending = () => {
    const successRows = rows.filter(row => row.status === 'success' && row.result);

    if (successRows.length === 0) {
      return;
    }

    const baseUrl = urlType === 'production'
      ? 'https://store.openreview.jp/staff-invitation/'
      : 'http://localhost:3000/staff-invitation/';

    const data = successRows.map(row => {
      const url = `${baseUrl}${row.result.token}`;
      return `${row.result.name}さん\n下記URLをタップしてスタッフ登録をお願いします\n${url}`;
    }).join('\n\n---\n\n');

    navigator.clipboard.writeText(data);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // スプレッドシート用（タブ区切り）でコピー
  const copyForSpreadsheet = () => {
    const successRows = rows.filter(row => row.status === 'success' && row.result);

    if (successRows.length === 0) {
      return;
    }

    const baseUrl = urlType === 'production'
      ? 'https://store.openreview.jp/staff-invitation/'
      : 'http://localhost:3000/staff-invitation/';

    const header = '名前\tロール\tURL';
    const data = successRows.map(row => {
      const roleLabel = row.role === 'STORE' ? '店舗管理者' : 'スタッフ';
      const url = `${baseUrl}${row.result.token}`;
      return `${row.result.name}\t${roleLabel}\t${url}`;
    }).join('\n');

    navigator.clipboard.writeText(`${header}\n${data}`);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClose = () => {
    setRows([
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow()
    ]);
    setError(null);
    setSuccess(false);
    setProgress(0);
    onClose();
  };

  const validRowCount = rows.filter(row => row.name.trim()).length;
  const successCount = rows.filter(row => row.status === 'success').length;

  return (
    <Dialog
      open={true}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonAdd sx={{ color: '#5e17eb', mr: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              スタッフ一括招待
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {storeName}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* 進捗バー */}
        {isSubmitting && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1, color: '#64748b' }}>
              招待を作成中... ({Math.round(progress)}%)
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                }
              }}
            />
          </Box>
        )}

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* 結果サマリー */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <PersonAdd sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#10b981' }}>
                招待が完了しました！
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                {successCount}件の招待URLを発行しました
              </Typography>
            </Box>

            {/* URL選択とコピーボタン */}
            <Box sx={{
              mb: 3,
              p: 2,
              background: '#f8fafc',
              borderRadius: 2,
              border: '1px solid #e2e8f0'
            }}>
              {/* URL種類選択 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                  コピーするURL:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label="本番URL"
                    onClick={() => setUrlType('production')}
                    sx={{
                      cursor: 'pointer',
                      background: urlType === 'production' ? '#10b981' : '#e2e8f0',
                      color: urlType === 'production' ? '#fff' : '#64748b',
                      '&:hover': {
                        background: urlType === 'production' ? '#059669' : '#cbd5e1',
                      }
                    }}
                  />
                  <Chip
                    label="開発URL"
                    onClick={() => setUrlType('development')}
                    sx={{
                      cursor: 'pointer',
                      background: urlType === 'development' ? '#5e17eb' : '#e2e8f0',
                      color: urlType === 'development' ? '#fff' : '#64748b',
                      '&:hover': {
                        background: urlType === 'development' ? '#4c1d95' : '#cbd5e1',
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* コピーボタン */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={copySuccess ? <Check /> : <ContentCopy />}
                  onClick={copyForSending}
                  sx={{
                    background: copySuccess
                      ? '#10b981'
                      : 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                    '&:hover': {
                      background: copySuccess
                        ? '#059669'
                        : 'linear-gradient(45deg, #4c1d95 30%, #5b3d8a 90%)',
                    }
                  }}
                >
                  {copySuccess ? 'コピーしました！' : '送信用にコピー（名前+URL）'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={copyForSpreadsheet}
                  sx={{
                    borderColor: '#5e17eb',
                    color: '#5e17eb',
                    '&:hover': {
                      borderColor: '#4c1d95',
                      backgroundColor: 'rgba(94, 23, 235, 0.05)',
                    }
                  }}
                >
                  スプレッドシート用にコピー
                </Button>
              </Box>

              {/* コピー形式プレビュー */}
              <Box sx={{ mt: 2, p: 2, background: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1 }}>
                  送信用コピー形式プレビュー:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#374151', whiteSpace: 'pre-line' }}>
                  {rows.filter(row => row.status === 'success').slice(0, 1).map(row =>
                    `${row.result?.name}さん\n下記URLをタップしてスタッフ登録をお願いします\n${urlType === 'production' ? 'https://store.openreview.jp' : 'http://localhost:3000'}/staff-invitation/${row.result?.token?.slice(0, 8)}...`
                  ).join('') || '（招待成功後に表示されます）'}
                </Typography>
              </Box>
            </Box>

            {/* 結果テーブル */}
            <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, width: 60 }}>状態</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>名前</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>ロール</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {urlType === 'production' ? '本番URL' : '開発URL'}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.filter(row => row.name.trim()).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {row.status === 'success' ? (
                          <Chip
                            icon={<Check sx={{ fontSize: 16 }} />}
                            label="成功"
                            size="small"
                            color="success"
                          />
                        ) : row.status === 'error' ? (
                          <Tooltip title={row.result?.error || 'エラー'}>
                            <Chip
                              icon={<ErrorIcon sx={{ fontSize: 16 }} />}
                              label="失敗"
                              size="small"
                              color="error"
                            />
                          </Tooltip>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={row.role === 'STORE' ? '店舗管理者' : 'スタッフ'}
                          size="small"
                          sx={{
                            background: row.role === 'STORE' ? '#fef3c7' : '#dbeafe',
                            color: row.role === 'STORE' ? '#92400e' : '#1e40af'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {row.status === 'success' && row.result?.token && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: urlType === 'production' ? '#166534' : '#374151',
                                maxWidth: 400,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {urlType === 'production'
                                ? `https://store.openreview.jp/staff-invitation/${row.result.token}`
                                : `http://localhost:3000/staff-invitation/${row.result.token}`
                              }
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const url = urlType === 'production'
                                  ? `https://store.openreview.jp/staff-invitation/${row.result.token}`
                                  : `http://localhost:3000/staff-invitation/${row.result.token}`;
                                navigator.clipboard.writeText(url);
                              }}
                            >
                              <ContentCopy sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              variant="contained"
              fullWidth
              onClick={handleClose}
              sx={{
                mt: 3,
                background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
                py: 1.5
              }}
            >
              閉じる
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ペーストエリア */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<ContentPaste />}
                  onClick={handlePasteFromClipboard}
                  disabled={isSubmitting}
                  sx={{
                    borderColor: '#10b981',
                    color: '#10b981',
                    '&:hover': {
                      borderColor: '#059669',
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    }
                  }}
                >
                  スプレッドシートから一括ペースト
                </Button>
                {!showPasteArea && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setShowPasteArea(true)}
                    sx={{ color: '#64748b' }}
                  >
                    手動でペースト
                  </Button>
                )}
              </Box>

              {showPasteArea && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    スプレッドシートからコピーした内容をここに貼り付けてください（名前, ロール の形式）
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder={`山田太郎\tSTAFF\n田中花子\tSTORE\n佐藤一郎\n...\n\n※ロールは省略可（デフォルト: スタッフ）\n※ロール列: STAFF/スタッフ または STORE/店舗管理者/管理者`}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData('text');
                      handlePasteData(text);
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#10b981',
                        }
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handlePasteData(pasteText)}
                      disabled={!pasteText.trim()}
                      sx={{
                        background: '#10b981',
                        '&:hover': { background: '#059669' }
                      }}
                    >
                      適用
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowPasteArea(false);
                        setPasteText('');
                      }}
                      sx={{ color: '#64748b' }}
                    >
                      キャンセル
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>

            {/* 入力テーブル */}
            <TableContainer component={Paper} sx={{ border: '1px solid #e2e8f0', mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, width: 60 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>名前 *</TableCell>
                    <TableCell sx={{ fontWeight: 600, width: 180 }}>権限</TableCell>
                    <TableCell sx={{ width: 60 }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell sx={{ color: '#64748b' }}>{index + 1}</TableCell>
                      <TableCell>
                        <TextField
                          placeholder="山田太郎"
                          fullWidth
                          size="small"
                          value={row.name}
                          onChange={handleInputChange(index, 'name')}
                          disabled={isSubmitting}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#5e17eb',
                              }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.role}
                            onChange={handleInputChange(index, 'role')}
                            disabled={isSubmitting}
                          >
                            <MenuItem value="STAFF">スタッフ</MenuItem>
                            <MenuItem value="STORE">店舗管理者</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => removeRow(index)}
                          disabled={isSubmitting || rows.length <= 1}
                          sx={{ color: '#ef4444' }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 行追加ボタン */}
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={addRow}
              disabled={isSubmitting}
              sx={{
                mb: 3,
                borderColor: '#5e17eb',
                color: '#5e17eb',
                '&:hover': {
                  borderColor: '#4c1d95',
                  backgroundColor: 'rgba(94, 23, 235, 0.05)',
                }
              }}
            >
              行を追加
            </Button>

            {/* 注意事項 */}
            <Box
              sx={{
                p: 3,
                background: '#fef3c7',
                borderRadius: 2,
                border: '1px solid #fbbf24'
              }}
            >
              <Typography variant="body2" sx={{ color: '#92400e', lineHeight: 1.6 }}>
                <strong>使い方:</strong><br />
                • スプレッドシートから「名前」「ロール」の列をコピーして一括ペースト可能<br />
                • ロール列は省略可（デフォルト: スタッフ）<br />
                • 結果もタブ区切りでコピーできます（Excelなどに貼り付け可能）<br /><br />
                <strong>注意:</strong><br />
                • 招待URLは24時間で無効になります<br />
                • 招待された方はGoogleまたはLINEアカウントでログインが必要です
              </Typography>
            </Box>
          </motion.div>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mr: 'auto' }}>
            {validRowCount}件の招待を作成します
          </Typography>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
            sx={{ color: '#64748b' }}
          >
            キャンセル
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting || validRowCount === 0}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Send />
              )
            }
            onClick={handleSubmit}
            sx={{
              background: 'linear-gradient(45deg, #5e17eb 30%, #764ba2 90%)',
              boxShadow: '0 4px 15px rgba(94, 23, 235, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(94, 23, 235, 0.4)',
              },
              '&:disabled': {
                background: '#e2e8f0',
                color: '#94a3b8',
                boxShadow: 'none',
                transform: 'none'
              }
            }}
          >
            {isSubmitting ? '招待中...' : `${validRowCount}件を一括招待`}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
