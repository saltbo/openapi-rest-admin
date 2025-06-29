// 测试脚本：验证嵌套资源解析
import { frontendAPIService } from './app/services/frontend/index.js';

async function testNestedResourceParsing() {
  try {
    console.log('测试开始：验证嵌套资源解析...');
    
    // 1. 获取 single-resource API 的分析结果
    console.log('\n1. 获取 single-resource API 分析结果...');
    const analysis = await frontendAPIService.getOpenAPIAnalysis('single-resource');
    console.log('分析成功:', analysis.success);
    
    if (analysis.data) {
      console.log('顶级资源数量:', analysis.data.resources.length);
      
      // 遍历顶级资源
      analysis.data.resources.forEach((resource, index) => {
        console.log(`\n顶级资源 ${index + 1}:`);
        console.log('  名称:', resource.name);
        console.log('  ID:', resource.id);
        console.log('  路径:', resource.path);
        console.log('  方法:', resource.methods);
        console.log('  是否RESTful:', resource.is_restful);
        
        if (resource.sub_resources && resource.sub_resources.length > 0) {
          console.log('  子资源数量:', resource.sub_resources.length);
          resource.sub_resources.forEach((subResource, subIndex) => {
            console.log(`    子资源 ${subIndex + 1}:`);
            console.log('      名称:', subResource.name);
            console.log('      ID:', subResource.id);
            console.log('      路径:', subResource.path);
            console.log('      方法:', subResource.methods);
            console.log('      是否RESTful:', subResource.is_restful);
          });
        }
      });
    }
    
    // 2. 测试查找嵌套资源
    console.log('\n2. 测试查找 pods 资源...');
    try {
      const podsData = await frontendAPIService.listResources('single-resource', 'pods', 1, 10);
      console.log('pods 资源查找成功:', podsData.success);
      console.log('pods 数据条数:', podsData.data?.length || 0);
    } catch (error) {
      console.log('pods 资源查找失败:', error.message);
    }
    
    // 3. 测试查找顶级资源
    console.log('\n3. 测试查找 deployments 资源...');
    try {
      const deploymentsData = await frontendAPIService.listResources('single-resource', 'deployments', 1, 10);
      console.log('deployments 资源查找成功:', deploymentsData.success);
      console.log('deployments 数据条数:', deploymentsData.data?.length || 0);
    } catch (error) {
      console.log('deployments 资源查找失败:', error.message);
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testNestedResourceParsing();
