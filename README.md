# 历史遗迹地图网站

一个展示历史文化遗迹的互动地图网站，以"武汉抗战旧址"为首个示例地图。

## 功能特性

✅ **互动地图展示** - 基于 Leaflet.js 的互动地图，标记历史遗迹位置
✅ **详细历史介绍** - 每个地点包含历史背景、建筑信息、开放时间等
✅ **用户评论系统** - 登录用户可以发表评论、查看他人评价
✅ **图片上传** - 用户可以上传地点相关照片
✅ **智能路线规划** - 支持多点路线优化，提供多种交通方式选择
✅ **自定义起终点** - 用户可以输入任意地址作为起点或终点
✅ **用户认证** - 基于 Supabase 的邮箱注册登录系统
✅ **自定义地图** - 用户可以创建自己的主题地图

## 技术栈

- **前端框架**: 纯 HTML/CSS/JavaScript
- **地图库**: Leaflet.js
- **数据库**: Supabase (PostgreSQL)
- **地图API**: 高德地图 Web API
- **部署**: Vercel
- **存储**: Supabase Storage

## 快速开始

### 前置要求

1. Supabase 账号 (https://supabase.com)
2. 高德地图开放平台账号 (https://lbs.amap.com)
3. Vercel 账号 (https://vercel.com)
4. GitHub 账号

### 配置步骤

详细的配置步骤请参考：

- `DETAILED_GUIDE_PART1.md` - Supabase 和高德地图配置
- `DETAILED_GUIDE_PART2.md` - 代码集成和 Vercel 部署

### 快速配置检查清单

#### 1. Supabase 配置

- [ ] 创建 Supabase 项目
- [ ] 执行数据库建表 SQL
- [ ] 配置 RLS 安全策略
- [ ] 执行额外 SQL 函数 (`supabase-functions.sql`)
- [ ] 创建 `images` 存储桶并设置为公开
- [ ] 复制 Project URL 和 Anon Key

#### 2. 高德地图配置

- [ ] 注册并通过实名认证
- [ ] 创建应用
- [ ] 添加 Web 端 Key
- [ ] 配置域名白名单
- [ ] 复制 API Key

#### 3. 代码配置

- [ ] 在 `supabase-config.js` 中填入 Supabase 配置
- [ ] 在 `amap-config.js` 中填入高德地图 Key
- [ ] 在 `heritage-map.html` 的 `<head>` 中引入 SDK
- [ ] 在 `heritage-map.html` 中添加登录模态框
- [ ] 更新相关函数以使用数据库

#### 4. 部署

- [ ] 创建 GitHub 仓库
- [ ] 上传所有文件到 GitHub
- [ ] 连接 Vercel 并导入项目
- [ ] 等待部署完成
- [ ] 更新高德地图白名单（添加 Vercel 域名）

## 项目结构

```
heritage-map/
├── heritage-map.html        # 主页面文件
├── supabase-config.js       # Supabase 配置和功能
├── amap-config.js           # 高德地图配置和功能
├── supabase-functions.sql   # Supabase 数据库函数
├── README.md                # 本文件
├── DETAILED_GUIDE_PART1.md  # 详细配置指南（第一部分）
└── DETAILED_GUIDE_PART2.md  # 详细配置指南（第二部分）
```

## 环境变量

需要在代码中配置以下信息：

### supabase-config.js

```javascript
const SUPABASE_URL = 'https://你的项目ID.supabase.co';
const SUPABASE_ANON_KEY = '你的anon密钥';
```

### amap-config.js

```javascript
const AMAP_KEY = '你的高德地图Key';
```

### heritage-map.html

```html
<script src="https://webapi.amap.com/maps?v=2.0&key=你的高德地图Key&plugin=..."></script>
```

## 免费额度

所有使用的服务都有充足的免费额度：

| 服务            | 免费额度  | 说明               |
| --------------- | --------- | ------------------ |
| Supabase 数据库 | 500MB     | 足够存储数万条评论 |
| Supabase 存储   | 1GB       | 足够存储数千张图片 |
| Supabase 认证   | 50K MAU   | 月活跃用户数       |
| 高德地图        | 30万次/日 | 个人开发者配额     |
| Vercel 部署     | 100GB/月  | 带宽               |

## 使用说明

### 用户功能

1. **浏览地图** - 查看所有标记的历史遗迹
2. **查看详情** - 点击标记查看地点的详细信息
3. **发表评论** - 登录后可以发表评价和上传图片
4. **路线规划** - 选择多个地点，自动规划最优游览路线
5. **自定义地图** - 创建自己的主题地图分享给其他用户

### 管理员功能

- 在 Supabase Dashboard 中管理用户
- 审核用户评论和图片
- 查看使用统计
- 导出数据

## 常见问题

### Q: 注册后没有收到验证邮件？

A: 在 Supabase 中关闭邮箱验证：Authentication → Providers → Email → 关闭 "Confirm email"

### Q: 地图不显示？

A: 检查高德地图 Key 是否正确，域名是否在白名单中

### Q: 评论无法提交？

A: 确认已登录，检查 Supabase RLS 策略是否正确配置

### Q: 自定义地址解析失败？

A: 确认输入的是武汉市内的详细地址（包含区名）

## 下一步开发计划

- [ ] 添加图片上传功能到评论
- [ ] 实现完整的"创建地图"功能
- [ ] 添加用户个人中心
- [ ] 实现地图分享功能
- [ ] 添加搜索功能
- [ ] 支持多语言
- [ ] 移动端优化
- [ ] PWA 支持（离线访问）

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 联系方式

如有问题，请提交 GitHub Issue。

---

## 致谢

- [Supabase](https://supabase.com) - 提供免费的数据库和认证服务
- [高德地图](https://lbs.amap.com) - 提供地图 API 服务
- [Vercel](https://vercel.com) - 提供免费的部署服务
- [Leaflet.js](https://leafletjs.com) - 开源地图库

---

**最后更新**: 2026年2月
