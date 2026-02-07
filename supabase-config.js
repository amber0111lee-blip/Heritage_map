// ======================================
// Supabase 配置和集成
// ======================================

// 替换为你的 Supabase 项目信息
const SUPABASE_URL = 'https://twabqwjndecjcdbldgpr.supabase.co';  // 从步骤 1.3 获取
const SUPABASE_ANON_KEY = 'sb_publishable_VWDn7SFM6X6uw_OvC39LGA_z6WeHowE';  // 从步骤 1.3 获取

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================
// 用户认证系统
// ======================================

const AuthSystem = {
  // 注册新用户
  async signUp(email, password, displayName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            display_name: displayName
          }
        }
      });
      
      if (error) throw error;
      
      // 创建用户资料
      if (data.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          display_name: displayName
        });
      }
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('注册失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 登录
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('登录失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 登出
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('登出失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 获取当前用户
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  // 监听认证状态
  onAuthStateChange(callback) {
    supabase.auth.onAuthStateChanged((event, session) => {
      callback(session?.user || null);
    });
  }
};

// ======================================
// 评论系统
// ======================================

const CommentSystem = {
  // 添加评论
  async addComment(locationId, text, rating) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          location_id: locationId,
          user_id: user.id,
          author_name: user.user_metadata.display_name || user.email,
          text: text,
          rating: rating
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, comment: data };
    } catch (error) {
      console.error('添加评论失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 加载评论
  async loadComments(locationId) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, comments: data };
    } catch (error) {
      console.error('加载评论失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 删除评论
  async deleteComment(commentId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('删除评论失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 点赞评论
  async likeComment(commentId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      // 检查是否已点赞
      const { data: existingLike } = await supabase
        .from('comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .single();
      
      if (existingLike) {
        // 取消点赞
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        
        await supabase.rpc('decrement_comment_likes', { comment_id: commentId });
        
        return { success: true, liked: false };
      } else {
        // 点赞
        await supabase
          .from('comment_likes')
          .insert({ comment_id: commentId, user_id: user.id });
        
        await supabase.rpc('increment_comment_likes', { comment_id: commentId });
        
        return { success: true, liked: true };
      }
    } catch (error) {
      console.error('点赞失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// ======================================
// 图片上传系统
// ======================================

const ImageSystem = {
  // 上传图片
  async uploadImage(file, locationId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        return { success: false, error: '只能上传图片文件' };
      }
      
      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return { success: false, error: '图片大小不能超过 5MB' };
      }
      
      // 生成唯一文件名
      const fileExt = file.name.split('.').pop();
      const fileName = `${locationId}/${user.id}_${Date.now()}.${fileExt}`;
      
      // 上传到 Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // 获取公开 URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);
      
      // 保存图片信息到数据库
      const { data: imageData, error: dbError } = await supabase
        .from('images')
        .insert({
          location_id: locationId,
          url: publicUrl,
          uploaded_by: user.id,
          uploader_name: user.user_metadata.display_name || user.email,
          file_size: file.size
        })
        .select()
        .single();
      
      if (dbError) throw dbError;
      
      return { success: true, url: publicUrl, image: imageData };
    } catch (error) {
      console.error('上传图片失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 获取地点图片
  async getLocationImages(locationId) {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, images: data };
    } catch (error) {
      console.error('获取图片失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// ======================================
// 自定义地图系统
// ======================================

const CustomMapSystem = {
  // 创建地图
  async createMap(mapData) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      const { data, error } = await supabase
        .from('custom_maps')
        .insert({
          title: mapData.title,
          description: mapData.description,
          location_ids: mapData.locationIds,
          created_by: user.id,
          creator_name: user.user_metadata.display_name || user.email,
          is_public: mapData.isPublic !== false,
          category: mapData.category || '其他'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, map: data };
    } catch (error) {
      console.error('创建地图失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 获取公开地图
  async getPublicMaps(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('custom_maps')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return { success: true, maps: data };
    } catch (error) {
      console.error('获取地图失败:', error);
      return { success: false, error: error.message };
    }
  },
  
  // 获取用户的地图
  async getUserMaps() {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) {
        return { success: false, error: '请先登录' };
      }
      
      const { data, error } = await supabase
        .from('custom_maps')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return { success: true, maps: data };
    } catch (error) {
      console.error('获取地图失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// 导出到全局
window.AuthSystem = AuthSystem;
window.CommentSystem = CommentSystem;
window.ImageSystem = ImageSystem;
window.CustomMapSystem = CustomMapSystem;
