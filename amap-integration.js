// ======================================
// 高德地图配置
// ======================================

// 替换为你的高德地图 Key
const AMAP_KEY = 'e4f9114d0564a5cbb8854bdde336a3b1';  // 从第二部分步骤 2.3 获取

// ======================================
// 地理编码系统
// ======================================

const GeocodingSystem = {
  geocoder: null,
  
  // 初始化
  init() {
    if (window.AMap && !this.geocoder) {
      this.geocoder = new AMap.Geocoder({
        city: '武汉',
        radius: 1000
      });
    }
  },

  // 确保 AMap 与 geocoder 已就绪，最多等待 5 秒
  async ensureInit(timeout = 5000) {
    if (this.geocoder) return;
    if (window.AMap) {
      this.init();
      return;
    }

    await new Promise((resolve, reject) => {
      const interval = 50;
      let waited = 0;
      const id = setInterval(() => {
        if (window.AMap) {
          clearInterval(id);
          this.init();
          resolve();
        } else {
          waited += interval;
          if (waited >= timeout) {
            clearInterval(id);
            reject(new Error('AMap 加载超时'));
          }
        }
      }, interval);
    });
  },
  
  // 地址转坐标
  async geocode(address) {
    try {
      await this.ensureInit();
    } catch (e) {
      return { success: false, error: 'AMap 未加载或超时' };
    }

    return new Promise((resolve) => {
      if (!this.geocoder) {
        resolve({ success: false, error: 'Geocoder 未就绪' });
        return;
      }

      this.geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.info === 'OK' && result.geocodes.length > 0) {
          const location = result.geocodes[0].location;
          resolve({
            success: true,
            lng: location.lng,
            lat: location.lat,
            formattedAddress: result.geocodes[0].formattedAddress
          });
        } else {
          resolve({ success: false, error: '地址解析失败' });
        }
      });
    });
  },
  
  // 坐标转地址
  async reverseGeocode(lng, lat) {
    try {
      await this.ensureInit();
    } catch (e) {
      return { success: false, error: 'AMap 未加载或超时' };
    }

    return new Promise((resolve) => {
      if (!this.geocoder) {
        resolve({ success: false, error: 'Geocoder 未就绪' });
        return;
      }

      this.geocoder.getAddress([lng, lat], (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          resolve({
            success: true,
            formattedAddress: result.regeocode.formattedAddress
          });
        } else {
          resolve({ success: false, error: '逆向地理编码失败' });
        }
      });
    });
  }
};

// ======================================
// 路线规划系统
// ======================================

const RoutePlanningSystem = {
  // 驾车路线
  async drivingRoute(origin, destination) {
    return new Promise((resolve) => {
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy.LEAST_TIME
      });
      
      driving.search(origin, destination, (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time,
            tolls: route.tolls || 0
          });
        } else {
          resolve({ success: false, error: '路线规划失败' });
        }
      });
    });
  },
  
  // 步行路线
  async walkingRoute(origin, destination) {
    return new Promise((resolve) => {
      const walking = new AMap.Walking();
      
      walking.search(origin, destination, (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time
          });
        } else {
          resolve({ success: false, error: '步行路线规划失败' });
        }
      });
    });
  },
  
  // 公交路线
  async transitRoute(origin, destination) {
    return new Promise((resolve) => {
      const transfer = new AMap.Transfer({
        city: '武汉',
        policy: AMap.TransferPolicy.LEAST_TIME
      });
      
      transfer.search(origin, destination, (status, result) => {
        if (status === 'complete' && result.info === 'OK' && result.plans.length > 0) {
          const plan = result.plans[0];
          resolve({
            success: true,
            distance: plan.distance,
            duration: plan.time,
            cost: plan.cost || 0
          });
        } else {
          resolve({ success: false, error: '公交路线规划失败' });
        }
      });
    });
  },
  
  // 骑行路线
  async ridingRoute(origin, destination) {
    return new Promise((resolve) => {
      const riding = new AMap.Riding();
      
      riding.search(origin, destination, (status, result) => {
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time
          });
        } else {
          resolve({ success: false, error: '骑行路线规划失败' });
        }
      });
    });
  },
  
  // 综合路线（所有交通方式）
  async comprehensiveRoute(origin, destination) {
    const [driving, walking, transit, riding] = await Promise.all([
      this.drivingRoute(origin, destination),
      this.walkingRoute(origin, destination),
      this.transitRoute(origin, destination),
      this.ridingRoute(origin, destination)
    ]);
    
    return { driving, walking, transit, riding };
  }
};

// 导出到全局
window.GeocodingSystem = GeocodingSystem;
window.RoutePlanningSystem = RoutePlanningSystem;
