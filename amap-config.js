// ======================================
// 高德地图配置
// ======================================

const AMAP_KEY = 'e4f9114d0564a5cbb8854bdde336a3b1';

// ======================================
// 地理编码系统
// ======================================

const GeocodingSystem = {
  // 地址转坐标
  async geocode(address) {
    return new Promise((resolve) => {
      if (!window.AMap) {
        resolve({ success: false, error: 'AMap 未加载，请检查网络连接和 API Key' });
        return;
      }

      const timer = setTimeout(() => {
        console.error('地理编码超时 - API Key 可能被拒绝或网络异常');
        resolve({ success: false, error: '地址解析超时，请检查：\n1. API Key 是否为"Web端(JS API)"类型\n2. 网络连接是否正常\n3. 请打开F12控制台查看具体错误' });
      }, 10000);

      AMap.plugin('AMap.Geocoder', function() {
        try {
          const geocoder = new AMap.Geocoder();
          console.log('正在解析地址:', address);

          geocoder.getLocation(address, (status, result) => {
            clearTimeout(timer);
            console.log('地理编码结果:', status, result);

            if (status === 'complete' && result.info === 'OK' && result.geocodes.length > 0) {
              const location = result.geocodes[0].location;
              resolve({
                success: true,
                lng: location.lng,
                lat: location.lat,
                formattedAddress: result.geocodes[0].formattedAddress
              });
            } else {
              const errCode = (result && result.info) || status || '未知';
              console.error('地理编码失败，错误码:', errCode);
              resolve({ success: false, error: '地址解析失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          clearTimeout(timer);
          resolve({ success: false, error: '地址解析出错: ' + e.message });
        }
      });
    });
  }
};

// ======================================
// 路线规划系统
// ======================================

const RoutePlanningSystem = {
  // 驾车路线 — 返回多条备选 + 每条的详细步骤
  async drivingRoute(origin, destination) {
    return new Promise((resolve) => {
      AMap.plugin('AMap.Driving', function() {
        try {
          const policy = (AMap.DrivingPolicy && AMap.DrivingPolicy.LEAST_TIME) || 0;
          const driving = new AMap.Driving({ policy });
          driving.search(origin, destination, (status, result) => {
            if (status === 'complete' && result.routes && result.routes.length > 0) {
              const routes = result.routes.slice(0, 3).map(route => ({
                distance: route.distance,
                duration: route.time,
                tolls: route.tolls || 0,
                steps: (route.steps || []).map(s => ({
                  instruction: s.instruction || s.road || '',
                  distance: s.distance || 0,
                  duration: s.time || 0,
                  path: (s.path || []).map(p => [p.lng !== undefined ? p.lng : p[0], p.lat !== undefined ? p.lat : p[1]])
                }))
              }));
              resolve({ success: true, routes });
            } else {
              const errCode = (result && result.info) || status || '未知';
              resolve({ success: false, error: '驾车路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '驾车路线出错: ' + e.message });
        }
      });
    });
  },

  // 步行路线 — 兼容 AMap 2.0 的 info='ok'（小写）及 route/routes 两种结构
  async walkingRoute(origin, destination) {
    return new Promise((resolve) => {
      AMap.plugin('AMap.Walking', function() {
        try {
          const walking = new AMap.Walking();
          walking.search(origin, destination, (status, result) => {
            const routes = result && (result.routes || (result.route ? [result.route] : null));
            const info = result && result.info;
            const ok = status === 'complete' || (info && info.toUpperCase() === 'OK');
            if (ok && routes && routes.length > 0) {
              const r = routes[0];
              resolve({
                success: true,
                routes: [{
                  distance: r.distance,
                  duration: r.time,
                  steps: (r.steps || []).map(s => ({
                    instruction: s.instruction || '',
                    distance: s.distance || 0,
                    duration: s.time || 0,
                    path: (s.path || []).map(p => [p.lng !== undefined ? p.lng : p[0], p.lat !== undefined ? p.lat : p[1]])
                  }))
                }]
              });
            } else {
              const errCode = info || status || '未知';
              resolve({ success: false, error: '步行路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '步行路线出错: ' + e.message });
        }
      });
    });
  },

  // 公交路线 — 返回多个备选方案 + 每方案的换乘段信息
  async transitRoute(origin, destination) {
    return new Promise((resolve) => {
      AMap.plugin('AMap.Transfer', function() {
        try {
          const policy = (AMap.TransferPolicy && AMap.TransferPolicy.LEAST_TIME) || 0;
          const transfer = new AMap.Transfer({ policy });
          transfer.search(origin, destination, (status, result) => {
            if (status === 'complete' && result.plans && result.plans.length > 0) {
              const plans = result.plans.slice(0, 3).map(plan => {
                const segments = (plan.segments || []).map(seg => {
                  if (seg.transit_mode === 'WALK' || !seg.transit) {
                    return {
                      type: 'walk',
                      distance: seg.distance || 0,
                      duration: seg.time || 0,
                      instruction: seg.instruction || '步行'
                    };
                  }
                  const t = seg.transit;
                  return {
                    type: 'vehicle',
                    line: t.name || (t.lines && t.lines[0] && t.lines[0].name) || '公交',
                    departure: t.departure_stop && t.departure_stop.name,
                    arrival: t.arrival_stop && t.arrival_stop.name,
                    via_stops: t.via_num || 0,
                    distance: seg.distance || 0,
                    duration: seg.time || 0
                  };
                });
                return {
                  distance: plan.distance,
                  duration: plan.time,
                  cost: plan.cost || 0,
                  walking_distance: plan.walking_distance || 0,
                  segments
                };
              });
              resolve({ success: true, plans });
            } else {
              const errCode = (result && result.info) || status || '未知';
              resolve({ success: false, error: '公交路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '公交路线出错: ' + e.message });
        }
      });
    });
  },

  // 骑行路线
  async ridingRoute(origin, destination) {
    return new Promise((resolve) => {
      AMap.plugin('AMap.Riding', function() {
        try {
          const riding = new AMap.Riding();
          riding.search(origin, destination, (status, result) => {
            const routes = result && (result.routes || (result.route ? [result.route] : null));
            if (status === 'complete' && routes && routes.length > 0) {
              const r = routes[0];
              resolve({
                success: true,
                routes: [{
                  distance: r.distance,
                  duration: r.time,
                  steps: (r.steps || []).map(s => ({
                    instruction: s.instruction || '',
                    distance: s.distance || 0,
                    duration: s.time || 0,
                    path: (s.path || []).map(p => [p.lng !== undefined ? p.lng : p[0], p.lat !== undefined ? p.lat : p[1]])
                  }))
                }]
              });
            } else {
              const errCode = (result && result.info) || status || '未知';
              resolve({ success: false, error: '骑行路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '骑行路线出错: ' + e.message });
        }
      });
    });
  }
};

// 页面加载完成后检查 AMap 状态
window.addEventListener('load', () => {
  if (window.AMap) {
    console.log('AMap 加载成功');
  } else {
    console.error('AMap 未加载！请检查 API Key 和网络连接');
  }
});

window.GeocodingSystem = GeocodingSystem;
window.RoutePlanningSystem = RoutePlanningSystem;
