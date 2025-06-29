import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Avatar, Button, Typography, Spin } from 'antd';
import { ApiOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { apiConfigClient } from '~/lib/client';
import type { APIConfig } from '~/types/api';

const { Title, Text } = Typography;

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);

  useEffect(() => {
    loadAPIConfigs();
  }, []);

  const loadAPIConfigs = async () => {
    try {
      setLoading(true);
      const configs = await apiConfigClient.getConfigs({ enabled: true });
      setApiConfigs(configs);
    } catch (error) {
      console.error('Failed to load API configs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 24px'
    }}>
      {/* 页面标题 */}
      <div style={{ 
        marginBottom: '48px', 
        textAlign: 'center',
        color: 'white',
        maxWidth: '800px',
        margin: '0 auto 48px auto'
      }}>
        <Title level={1} style={{ 
          color: 'white', 
          marginBottom: '20px',
          fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
          fontWeight: '700',
          textShadow: '0 4px 8px rgba(0,0,0,0.3)',
          letterSpacing: '-0.02em'
        }}>
          OpenAPI Admin
        </Title>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '20px',
          padding: '16px 32px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'inline-block'
        }}>
          <Text style={{ 
            color: 'rgba(255,255,255,0.95)', 
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '1.5'
          }}>
            🚀 选择一个 API 服务开始管理和查看资源数据
          </Text>
        </div>
      </div>

      {/* API 服务卡片 */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: '24px' }}>
              <Text style={{ fontSize: '16px', color: '#666' }}>加载 API 服务中...</Text>
            </div>
          </div>
        ) : apiConfigs.length > 0 ? (
          <Row gutter={[32, 32]} justify="start">
            {apiConfigs.map(config => (
              <Col xs={24} sm={12} md={8} lg={6} key={config.id}>
                <Link to={`/services/${config.id}`} style={{ textDecoration: 'none' }}>
                  <Card 
                    hoverable
                    style={{ 
                      height: '240px',
                      borderRadius: '20px',
                      border: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      background: 'rgba(255,255,255,0.98)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      overflow: 'hidden',
                      cursor: 'pointer'
                    }}
                    bodyStyle={{
                      padding: '24px',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center'
                    }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                      }}>
                        <ApiOutlined style={{ fontSize: '28px', color: 'white' }} />
                      </div>
                      <Title level={4} style={{ 
                        margin: '0 0 8px 0',
                        color: '#1a1a1a',
                        fontSize: '16px',
                        fontWeight: '600',
                        lineHeight: '1.2'
                      }}>
                        {config.name}
                      </Title>
                      <Text style={{ 
                        fontSize: '13px',
                        color: '#666',
                        lineHeight: '1.4',
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        height: '34px'
                      }}>
                        {config.description || '暂无描述'}
                      </Text>
                    </div>
                    
                    <div style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: '8px'
                    }}>
                      {config.version ? (
                        <div style={{
                          background: 'linear-gradient(135deg, #e8f4fd, #d1f2eb)',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(102, 126, 234, 0.1)'
                        }}>
                          <Text style={{ 
                            fontSize: '11px',
                            color: '#0369a1',
                            fontWeight: '500'
                          }}>
                            v{config.version}
                          </Text>
                        </div>
                      ) : (
                        <div style={{
                          padding: '6px 12px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white'
                        }}>
                          <Text style={{ 
                            fontSize: '11px',
                            color: 'white',
                            fontWeight: '500'
                          }}>
                            <EyeOutlined style={{ marginRight: '4px' }} />
                            查看
                          </Text>
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 40px',
            background: 'rgba(255,255,255,0.98)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{
              fontSize: '72px',
              marginBottom: '24px',
              opacity: 0.7,
              filter: 'grayscale(20%)'
            }}>
              📋
            </div>
            <Title level={2} style={{ 
              color: '#374151', 
              marginBottom: '16px',
              fontSize: '24px',
              fontWeight: '600'
            }}>
              暂无 API 服务配置
            </Title>
            <Text style={{ 
              fontSize: '16px', 
              color: '#6b7280', 
              marginBottom: '40px',
              display: 'block',
              lineHeight: '1.6'
            }}>
              还没有配置任何 API 服务，点击下方按钮开始配置您的第一个服务
            </Text>
            <Link to="/admin/apis">
              <Button 
                type="primary" 
                size="large"
                style={{
                  borderRadius: '16px',
                  height: '56px',
                  fontSize: '16px',
                  fontWeight: '600',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                }}
              >
                🚀 开始配置
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}