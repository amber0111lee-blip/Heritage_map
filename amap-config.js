// ======================================
// 高德地图配置
// ======================================

// 替换为你的高德地图 Key
const AMAP_KEY = 'e4f9114d0564a5cbb8854bdde336a3b1';  // 从第二部分步骤 2.3 获取

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

      // 使用 AMap.plugin() 确保插件完全就绪再调用
      AMap.plugin('AMap.Geocoder', function() {
        try {
          const geocoder = new AMap.Geocoder({ city: '武汉' });
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
  },
  
  // 坐标转地址
  async reverseGeocode(lng, lat) {
    if (!this.geocoder) {
      this.init();
    }
    
    return new Promise((resolve) => {
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
      console.log('规划驾车路线:', origin, destination);
      AMap.plugin('AMap.Driving', function() {
        try {
          const policy = (AMap.DrivingPolicy && AMap.DrivingPolicy.LEAST_TIME) || 0;
          const driving = new AMap.Driving({ policy });
          driving.search(origin, destination, (status, result) => {
            console.log('驾车路线结果:', status, result);
            if (status === 'complete' && result.info === 'OK') {
              const route = result.routes[0];
              resolve({ success: true, distance: route.distance, duration: route.time, tolls: route.tolls || 0 });
            } else {
              const errCode = (result && result.info) || status || '未知';
              console.error('驾车路线失败，错误码:', errCode);
              resolve({ success: false, error: '驾车路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '驾车路线出错: ' + e.message });
        }
      });
    });
  },

  // 步行路线
  async walkingRoute(origin, destination) {
    return new Promise((resolve) => {
      console.log('规划步行路线:', origin, destination);
      AMap.plugin('AMap.Walking', function() {
        try {
          const walking = new AMap.Walking();
          walking.search(origin, destination, (status, result) => {
            console.log('步行路线结果:', status, result);
            if (status === 'complete' && result.info === 'OK') {
              const route = result.routes[0];
              resolve({ success: true, distance: route.distance, duration: route.time });
            } else {
              const errCode = (result && result.info) || status || '未知';
              console.error('步行路线失败，错误码:', errCode);
              resolve({ success: false, error: '步行路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '步行路线出错: ' + e.message });
        }
      });
    });
  },

  // 公交路线
  async transitRoute(origin, destination) {
    return new Promise((resolve) => {
      console.log('规划公交路线:', origin, destination);
      AMap.plugin('AMap.Transfer', function() {
        try {
          const policy = (AMap.TransferPolicy && AMap.TransferPolicy.LEAST_TIME) || 0;
          const transfer = new AMap.Transfer({ city: '武汉', policy });
          transfer.search(origin, destination, (status, result) => {
            console.log('公交路线结果:', status, result);
            if (status === 'complete' && result.info === 'OK' && result.plans.length > 0) {
              const plan = result.plans[0];
              resolve({ success: true, distance: plan.distance, duration: plan.time, cost: plan.cost || 0 });
            } else {
              const errCode = (result && result.info) || status || '未知';
              console.error('公交路线失败，错误码:', errCode);
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
      console.log('规划骑行路线:', origin, destination);
      AMap.plugin('AMap.Riding', function() {
        try {
          const riding = new AMap.Riding();
          riding.search(origin, destination, (status, result) => {
            console.log('骑行路线结果:', status, result);
            if (status === 'complete' && result.info === 'OK') {
              const route = result.routes[0];
              resolve({ success: true, distance: route.distance, duration: route.time });
            } else {
              const errCode = (result && result.info) || status || '未知';
              console.error('骑行路线失败，错误码:', errCode);
              resolve({ success: false, error: '骑行路线规划失败 [错误码: ' + errCode + ']' });
            }
          });
        } catch (e) {
          resolve({ success: false, error: '骑行路线出错: ' + e.message });
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

// 页面加载完成后检查 AMap 状态
window.addEventListener('load', () => {
  if (window.AMap) {
    console.log('AMap 加载成功，版本:', AMap.version || '未知');
  } else {
    console.error('AMap 未加载！请检查 API Key 和网络连接');
  }
});

// 导出到全局
window.GeocodingSystem = GeocodingSystem;
window.RoutePlanningSystem = RoutePlanningSystem;