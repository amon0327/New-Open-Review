import { supabaseBlog } from '../lib/supabaseBlog';

class ArticleDataService {
  // 記事一覧を取得（公開済みのもののみ）
  static async getPublishedArticles(limit = 10) {
    try {
      const { data: postsData, error: postsError } = await supabaseBlog
        .from('posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          read_time_minutes,
          view_count,
          like_count,
          status,
          published_at,
          created_at,
          updated_at,
          author_id,
          post_user,
          pick_up,
          post_categories!inner (
            categories (
              name,
              slug,
              color
            )
          ),
          post_tags (
            tags (
              name,
              slug
            )
          ),
          admin_users (
            id,
            name,
            image,
            career
          )
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(limit);

      if (postsError) {
        console.error('記事取得エラー:', postsError);
        return {
          success: false,
          error: postsError.message,
          data: []
        };
      }

      // データを適切な形式に変換
      const formattedData = postsData?.map(post => ({
        id: post.id,
        title: post.title || '記事タイトル',
        excerpt: post.excerpt || '記事の概要が表示されます',
        thumbnail_url: post.featured_image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=316&fit=crop',
        category: post.post_categories?.[0]?.categories?.slug || 'general',
        category_name: post.post_categories?.[0]?.categories?.name || '一般',
        category_color: post.post_categories?.[0]?.categories?.color || '#5e17eb',
        keywords: post.post_tags?.map(tag => tag.tags?.name).filter(Boolean) || [],
        read_time_minutes: post.read_time_minutes || 5,
        published_at: post.published_at,
        view_count: post.view_count || 0,
        like_count: post.like_count || 0,
        author: {
          id: post.admin_users?.id,
          name: post.admin_users?.name || '著者',
          image: post.admin_users?.image,
          career: post.admin_users?.career
        }
      })) || [];

      return {
        success: true,
        data: formattedData,
        error: null
      };

    } catch (error) {
      console.error('記事取得中にエラーが発生しました:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // 人気記事を取得
  static async getPopularArticles(limit = 5) {
    try {
      const { data, error } = await supabaseBlog
        .from('posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          featured_image_url,
          read_time_minutes,
          view_count,
          like_count,
          published_at,
          post_categories!inner (
            categories (
              name,
              slug,
              color
            )
          )
        `)
        .eq('status', 'published')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('人気記事取得エラー:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      const formattedData = data?.map(post => ({
        id: post.id,
        title: post.title || '記事タイトル',
        excerpt: post.excerpt || '記事の概要が表示されます',
        thumbnail_url: post.featured_image_url || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=316&fit=crop',
        category_name: post.post_categories?.[0]?.categories?.name || '一般',
        category_color: post.post_categories?.[0]?.categories?.color || '#5e17eb',
        read_time_minutes: post.read_time_minutes || 5,
        published_at: post.published_at,
        view_count: post.view_count || 0,
        like_count: post.like_count || 0
      })) || [];

      return {
        success: true,
        data: formattedData,
        error: null
      };

    } catch (error) {
      console.error('人気記事取得中にエラーが発生しました:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // 特定の記事を取得
  static async getArticleBySlug(slug) {
    try {
      const { data: postData, error: postError } = await supabaseBlog
        .from('posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          content_html,
          content_markdown,
          featured_image_url,
          read_time_minutes,
          view_count,
          like_count,
          status,
          published_at,
          created_at,
          updated_at,
          author_id,
          post_user,
          meta_title,
          meta_description,
          og_title,
          og_description,
          og_image_url,
          post_categories!inner (
            categories (
              name,
              slug,
              color
            )
          ),
          post_tags (
            tags (
              name,
              slug
            )
          ),
          admin_users (
            id,
            name,
            image,
            career,
            department
          )
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (postError) {
        console.error('記事詳細取得エラー:', postError);
        return {
          success: false,
          error: postError.message,
          data: null
        };
      }

      return {
        success: true,
        data: postData,
        error: null
      };

    } catch (error) {
      console.error('記事詳細取得中にエラーが発生しました:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  // カテゴリ一覧を取得
  static async getCategories() {
    try {
      const { data, error } = await supabaseBlog
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('カテゴリ取得エラー:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || [],
        error: null
      };

    } catch (error) {
      console.error('カテゴリ取得中にエラーが発生しました:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }

  // タグ一覧を取得
  static async getTags() {
    try {
      const { data, error } = await supabaseBlog
        .from('tags')
        .select('*')
        .order('name');

      if (error) {
        console.error('タグ取得エラー:', error);
        return {
          success: false,
          error: error.message,
          data: []
        };
      }

      return {
        success: true,
        data: data || [],
        error: null
      };

    } catch (error) {
      console.error('タグ取得中にエラーが発生しました:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

export default ArticleDataService;