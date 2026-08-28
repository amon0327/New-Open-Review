import { createClient } from '@supabase/supabase-js'

// OpenReview Blog用のSupabase設定
const blogSupabaseUrl = 'https://ngayxdzippnqkzufqxhr.supabase.co'
const blogSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nYXl4ZHppcHBucWt6dWZxeGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NDA5NDMsImV4cCI6MjA2ODIxNjk0M30.xSPlCckdiB4mVfPeG5Fle-fGKADvft7qRcWbIxEVu4A'

export const supabaseBlog = createClient(blogSupabaseUrl, blogSupabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// 人気記事を取得
export const getPopularPosts = async (limit = 10) => {
  try {
    const { data, error } = await supabaseBlog
      .from('posts')
      .select('id, title, slug, view_count, like_count, created_at, excerpt, featured_image_url')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Failed to get popular posts:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Failed to get popular posts:', error)
    return []
  }
}

// 関連記事を取得（カテゴリベース）
export const getRelatedPosts = async (postId, categories = [], limit = 5) => {
  try {
    let query = supabaseBlog
      .from('posts')
      .select(`
        id, title, slug, view_count, like_count, created_at, excerpt, featured_image_url,
        post_categories!inner(category_id),
        categories!inner(name)
      `)
      .eq('status', 'published')
      .neq('id', postId)

    if (categories.length > 0) {
      query = query.in('post_categories.category_id', categories)
    }

    const { data, error } = await query
      .order('view_count', { ascending: false })
      .limit(limit)

    return data || []
  } catch (error) {
    console.error('Failed to get related posts:', error)
    return []
  }
}