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
      console.log('GeocodingSystem 初始化成功');
    } else if (!window.AMap) {
      console.error('高德地图 AMap 对象未加载，请检查 API 引入');
    }
  },
  
  // 地址转坐标
  async geocode(address) {
    // 确保初始化
    if (!this.geocoder) {
      this.init();
    }
    
    if (!this.geocoder) {
      console.error('Geocoder 初始化失败');
      return { success: false, error: 'Geocoder 初始化失败，请检查高德地图 API' };
    }
    
    return new Promise((resolve) => {
      console.log('正在解析地址:', address);
      
      this.geocoder.getLocation(address, (status, result) => {
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
          resolve({ success: false, error: '地址解析失败: ' + (result.info || status) });
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
      
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy.LEAST_TIME
      });
      
      driving.search(origin, destination, (status, result) => {
        console.log('驾车路线结果:', status, result);
        
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time,
            tolls: route.tolls || 0
          });
        } else {
          resolve({ success: false, error: '驾车路线规划失败: ' + (result.info || status) });
        }
      });
    });
  },
  
  // 步行路线
  async walkingRoute(origin, destination) {
    return new Promise((resolve) => {
      console.log('规划步行路线:', origin, destination);
      
      const walking = new AMap.Walking();
      
      walking.search(origin, destination, (status, result) => {
        console.log('步行路线结果:', status, result);
        
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time
          });
        } else {
          resolve({ success: false, error: '步行路线规划失败: ' + (result.info || status) });
        }
      });
    });
  },
  
  // 公交路线
  async transitRoute(origin, destination) {
    return new Promise((resolve) => {
      console.log('规划公交路线:', origin, destination);
      
      const transfer = new AMap.Transfer({
        city: '武汉',
        policy: AMap.TransferPolicy.LEAST_TIME
      });
      
      transfer.search(origin, destination, (status, result) => {
        console.log('公交路线结果:', status, result);
        
        if (status === 'complete' && result.info === 'OK' && result.plans.length > 0) {
          const plan = result.plans[0];
          resolve({
            success: true,
            distance: plan.distance,
            duration: plan.time,
            cost: plan.cost || 0
          });
        } else {
          resolve({ success: false, error: '公交路线规划失败: ' + (result.info || status) });
        }
      });
    });
  },
  
  // 骑行路线
  async ridingRoute(origin, destination) {
    return new Promise((resolve) => {
      console.log('规划骑行路线:', origin, destination);
      
      const riding = new AMap.Riding();
      
      riding.search(origin, destination, (status, result) => {
        console.log('骑行路线结果:', status, result);
        
        if (status === 'complete' && result.info === 'OK') {
          const route = result.routes[0];
          resolve({
            success: true,
            distance: route.distance,
            duration: route.time
          });
        } else {
          resolve({ success: false, error: '骑行路线规划失败: ' + (result.info || status) });
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

// 页面加载完成后初始化
window.addEventListener('load', () => {
  console.log('页面加载完成，初始化地理编码系统');
  GeocodingSystem.init();
});

// 导出到全局
window.GeocodingSystem = GeocodingSystem;
window.RoutePlanningSystem = RoutePlanningSystem;