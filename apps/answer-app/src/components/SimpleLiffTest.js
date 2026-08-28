import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import liff from '@line/liff';

const SimpleLiffTest = () => {
  const [logs, setLogs] = useState([]);
  const [lineUser, setLineUser] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`[LIFF Test] ${message}`);
  };

  useEffect(() => {
    testLiff();
  }, []);

  const testLiff = async () => {
    addLog('Starting LIFF test...');
    
    // 1. LIFF初期化
    try {
      const liffId = process.env.REACT_APP_LIFF_ID_DEV || '2008812853-cYd3wiPJ';
      addLog(`LIFF ID: ${liffId}`);
      
      await liff.init({ liffId });
      addLog('LIFF initialized successfully');
      
      // 2. 状態確認
      addLog(`Is in client: ${liff.isInClient()}`);
      addLog(`Is logged in: ${liff.isLoggedIn()}`);
      
      // 3. プロファイル取得
      if (liff.isLoggedIn()) {
        const profile = await liff.getProfile();
        addLog(`Profile: ${JSON.stringify(profile)}`);
        setLineUser(profile);
        
        // 4. 直接Supabaseに保存（Edge Function不要）
        await saveUserDirectly(profile);
      } else {
        addLog('Not logged in - trying to login...');
        liff.login();
      }
      
    } catch (error) {
      addLog(`Error: ${error.message}`);
    }
  };
  
  const saveUserDirectly = async (profile) => {
    addLog('Saving user to database...');
    
    try {
      // LocalStorageに保存
      const userData = {
        id: profile.userId,
        email: `${profile.userId}@line.local`,
        name: profile.displayName || 'LINEユーザー',
        created_at: new Date().toISOString()
      };
      
      localStorage.setItem('line_user', JSON.stringify(userData));
      addLog('User saved to localStorage');
      
      // Edge Function呼び出し（オプション）
      const response = await fetch(`${process.env.REACT_APP_SUPABASE_URL}/functions/v1/line-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ lineProfile: profile })
      });
      
      if (response.ok) {
        addLog('User saved to database via Edge Function');
      } else {
        addLog(`Edge Function error: ${response.status}`);
      }
      
    } catch (error) {
      addLog(`Save error: ${error.message}`);
    }
  };
  
  const clearAndRetry = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>LIFF Test Page</Typography>
      
      {lineUser && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography>LINE User: {lineUser.displayName}</Typography>
          <Typography>ID: {lineUser.userId}</Typography>
        </Box>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={clearAndRetry}>
          Clear & Retry
        </Button>
      </Box>
      
      <Box sx={{ 
        bgcolor: 'grey.900', 
        color: 'grey.100', 
        p: 2, 
        borderRadius: 1,
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        maxHeight: 400,
        overflow: 'auto'
      }}>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </Box>
    </Box>
  );
};

export default SimpleLiffTest;