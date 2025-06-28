import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function Settings() {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>系统设置</Title>
      <Card>
        <Paragraph>这里将包含应用程序设置和配置选项。</Paragraph>
      </Card>
    </div>
  );
}
