# 24時間制限の復旧手順

現在、招待URLの24時間制限チェックは一時的に無効化されています。

## 24時間制限を再有効化する手順

### 1. Edge Functionのコード修正

`supabase/functions/complete-staff-invitation/index.ts` の以下の部分を修正：

**現在（無効化状態）:**
```typescript
// 24時間チェック（一時的に無効化）
const invitationDate = new Date(invitation.created_at)
const now = new Date()
const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

console.log('Time check:', { invitationDate, now, hoursDiff })
console.log('24時間制限チェックは一時的に無効化されています')

// 24時間制限を一時的に無効化
// if (hoursDiff > 24) {
//   // 期限切れの招待をexpiredに更新（サービスロールで）
//   console.log('Invitation expired, updating status')
//   await supabaseAdmin
//     .from('store_invitations')
//     .update({ status: 'expired' })
//     .eq('token', invitationToken)
//   
//   throw new Error('招待の有効期限が切れています（24時間）')
// }
```

**復旧版（有効化状態）:**
```typescript
// 24時間チェック
const invitationDate = new Date(invitation.created_at)
const now = new Date()
const hoursDiff = (now.getTime() - invitationDate.getTime()) / (1000 * 60 * 60)

console.log('Time check:', { invitationDate, now, hoursDiff })

if (hoursDiff > 24) {
  // 期限切れの招待をexpiredに更新（サービスロールで）
  console.log('Invitation expired, updating status')
  await supabaseAdmin
    .from('store_invitations')
    .update({ status: 'expired' })
    .eq('token', invitationToken)
  
  throw new Error('招待の有効期限が切れています（24時間）')
}
```

### 2. デプロイ

```bash
supabase functions deploy complete-staff-invitation
```

### 3. 確認

- 24時間以上経過した招待URLでテストし、適切にエラーが表示されることを確認
- Edge Functionのログで期限チェックが動作していることを確認

## 現在の状態

✅ **24時間制限: 無効化済み**  
📝 **理由**: 一時的な運用要件のため  
🔄 **復旧**: 上記手順で再有効化可能