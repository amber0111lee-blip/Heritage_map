// ======================================
// Supabase 配置和集成
// ======================================

// 替换为你的 Supabase 项目信息
const SUPABASE_URL = 'https://twabqwjndecjcdbldgpr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VWDn7SFM6X6uw_OvC39LGA_z6WeHowE';

// ✅ 修改这里：替换为你的实际部署地址
// 本地开发时用 'http://localhost:3000'，上线后换成正式域名
const SITE_URL = window.location.origin;

// 初始化 Supabase 客户端
if (!window.supabase) {
  throw new Error('Supabase CDN 未加载，请检查网络连接或 CDN 地址');
}
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
          },
          // ✅ 新增：告知 Supabase 用户点击邮件确认链接后跳回哪个页面
          emailRedirectTo: SITE_URL + '/index.html'
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
  
  // 验证注册OTP验证码
  async verifyOtp(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'signup'
      });
      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('验证码验证失败:', error);
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
    supabase.auth.onAuthStateChange((event, session) => {
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

// ======================================
// 地图系统
// ======================================

const MapSystem = {
  // 获取公开地图列表（含地点数量）
  async getMaps(limit = 20) {
    try {
      const { data, error } = await supabase
        .from('custom_maps')
        .select('*')
        .eq('is_public', true)
        .order('is_example', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return { success: true, maps: data };
    } catch (error) {
      console.error('获取地图列表失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 获取单张地图
  async getMapById(mapId) {
    try {
      const { data, error } = await supabase
        .from('custom_maps')
        .select('*')
        .eq('id', mapId)
        .single();
      if (error) throw error;
      return { success: true, map: data };
    } catch (error) {
      console.error('获取地图失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 创建地图
  async createMap(title, description, theme, isPublic) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };

      const { data, error } = await supabase
        .from('custom_maps')
        .insert({
          title,
          description,
          theme: theme || '人文历史',
          is_public: isPublic !== false,
          created_by: user.id,
          creator_name: user.user_metadata?.display_name || user.email,
          saves: 0,
          views: 0
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

  // 收藏地图
  async saveMap(mapId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };

      const { error } = await supabase
        .from('map_saves')
        .insert({ user_id: user.id, map_id: mapId });
      if (error) throw error;

      await supabase.rpc('increment_map_saves', { map_id: mapId });
      return { success: true };
    } catch (error) {
      console.error('收藏失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 取消收藏
  async unsaveMap(mapId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };

      const { error } = await supabase
        .from('map_saves')
        .delete()
        .eq('user_id', user.id)
        .eq('map_id', mapId);
      if (error) throw error;

      await supabase.rpc('decrement_map_saves', { map_id: mapId });
      return { success: true };
    } catch (error) {
      console.error('取消收藏失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 检查是否已收藏
  async isSaved(mapId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return false;

      const { data } = await supabase
        .from('map_saves')
        .select('user_id')
        .eq('user_id', user.id)
        .eq('map_id', mapId)
        .single();
      return !!data;
    } catch {
      return false;
    }
  },

  // 获取当前用户创建的地图
  async getUserMaps() {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };

      const { data, error } = await supabase
        .from('custom_maps')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, maps: data };
    } catch (error) {
      console.error('获取用户地图失败:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteMap(mapId) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };
      const { error: locErr } = await supabase
        .from('map_locations').delete().eq('map_id', mapId);
      if (locErr) console.warn('删除地点警告:', locErr.message);
      const { error } = await supabase
        .from('custom_maps').delete().eq('id', mapId).eq('created_by', user.id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('删除地图失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// ======================================
// 地图地点系统
// ======================================

const MapLocationSystem = {
  // 添加地点
  async addLocation(mapId, data) {
    try {
      const { data: row, error } = await supabase
        .from('map_locations')
        .insert({ map_id: mapId, ...data })
        .select()
        .single();
      if (error) throw error;
      return { success: true, location: row };
    } catch (error) {
      console.error('添加地点失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 更新地点
  async updateLocation(locationId, data) {
    try {
      const { error } = await supabase
        .from('map_locations')
        .update(data)
        .eq('id', locationId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('更新地点失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 删除地点
  async deleteLocation(locationId) {
    try {
      const { error } = await supabase
        .from('map_locations')
        .delete()
        .eq('id', locationId);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('删除地点失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 获取地图的所有地点
  async getLocations(mapId) {
    try {
      const { data, error } = await supabase
        .from('map_locations')
        .select('*')
        .eq('map_id', mapId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return { success: true, locations: data };
    } catch (error) {
      console.error('获取地点失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// ======================================
// 地图评论系统（地图级别）
// ======================================

const MapCommentSystem = {
  // 发表评论
  async addComment(mapId, text, rating) {
    try {
      const user = await AuthSystem.getCurrentUser();
      if (!user) return { success: false, error: '请先登录' };

      const { data, error } = await supabase
        .from('map_comments')
        .insert({
          map_id: mapId,
          user_id: user.id,
          author_name: user.user_metadata?.display_name || user.email,
          text,
          rating: rating || 5
        })
        .select()
        .single();
      if (error) throw error;
      return { success: true, comment: data };
    } catch (error) {
      console.error('发表评论失败:', error);
      return { success: false, error: error.message };
    }
  },

  // 获取评论列表
  async getComments(mapId) {
    try {
      const { data, error } = await supabase
        .from('map_comments')
        .select('*')
        .eq('map_id', mapId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, comments: data };
    } catch (error) {
      console.error('获取评论失败:', error);
      return { success: false, error: error.message };
    }
  }
};

// 导出到全局
window.AuthSystem = AuthSystem;
window.CommentSystem = CommentSystem;
window.ImageSystem = ImageSystem;
window.CustomMapSystem = CustomMapSystem;
window.MapSystem = MapSystem;
window.MapLocationSystem = MapLocationSystem;
window.MapCommentSystem = MapCommentSystem;
