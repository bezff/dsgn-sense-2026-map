import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import Draggable from 'react-draggable';
import { QRCodeCanvas } from 'qrcode.react';
import { MapData, MarkerData } from '../types';
import * as api from '../api';
import { isBrailleModeEnabled, setBrailleModeEnabled } from '../brailleMode';

const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '';
};

const slideInRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
`;

const AdminLayout = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
`;

const Header = styled.header`
  height: 60px;
  background-color: #000000;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
  z-index: 50;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const BrailleToggleLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #ffffff;
  cursor: pointer;

  input {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
`;

const HeaderTitle = styled.div`
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Workspace = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: 360px;
  background-color: #ffffff;
  border-right: 4px solid #000000;
  display: flex;
  flex-direction: column;
  z-index: 20;
  flex-shrink: 0;
`;

const PanelSection = styled.div`
  padding: 24px;
  border-bottom: 4px solid #000000;
`;

const PanelHeader = styled.h2`
  font-size: 20px;
  font-weight: 900;
  text-transform: uppercase;
  margin: 0 0 20px 0;
  color: #000000;
  letter-spacing: 1px;
`;

const MarkersList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #f4f4f4;
  
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #e0e0e0; border-left: 2px solid #000; }
  &::-webkit-scrollbar-thumb { background: #000; }
`;

const MarkerListItem = styled.div<{ $active: boolean }>`
  padding: 16px;
  border: 3px solid #000000;
  margin-bottom: 12px;
  cursor: pointer;
  background-color: ${props => props.$active ? '#000000' : '#ffffff'};
  color: ${props => props.$active ? '#ffffff' : '#000000'};
  font-weight: 900;
  text-transform: uppercase;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.1s, box-shadow 0.1s;
  
  &:hover {
    transform: ${props => props.$active ? 'none' : 'translateX(4px)'};
    box-shadow: ${props => props.$active ? 'none' : '-4px 4px 0px #E30613'};
    border-color: ${props => props.$active ? '#000' : '#E30613'};
  }
`;

const MapArea = styled.div`
  flex: 1;
  position: relative;
  background-color: #e0e0e0;
  background-image: linear-gradient(#d0d0d0 1px, transparent 1px), linear-gradient(90deg, #d0d0d0 1px, transparent 1px);
  background-size: 40px 40px;
  overflow: auto;
  padding: 40px;
  text-align: center;
  
  &::-webkit-scrollbar { width: 12px; height: 12px; }
  &::-webkit-scrollbar-track { background: #f4f4f4; border-left: 3px solid #000; border-top: 3px solid #000; }
  &::-webkit-scrollbar-thumb { background: #000; }
`;

const MapContentWrapper = styled.div`
  position: relative;
  display: inline-block;
  text-align: left;
  box-shadow: 20px 20px 0px rgba(0,0,0,0.1);
`;

const MapImage = styled.img`
  display: block;
  max-width: 100%;
  height: auto;
  cursor: crosshair;
`;

const RightPanel = styled.div`
  width: 450px;
  background-color: #ffffff;
  border-left: 4px solid #000000;
  display: flex;
  flex-direction: column;
  z-index: 20;
  flex-shrink: 0;
  animation: ${slideInRight} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  box-shadow: -10px 0 30px rgba(0,0,0,0.1);
`;

const RightPanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: #e0e0e0; border-left: 2px solid #000; }
  &::-webkit-scrollbar-thumb { background: #000; }
`;

const RightPanelFooter = styled.div`
  padding: 24px;
  border-top: 4px solid #000000;
  background-color: #f4f4f4;
  display: flex;
  gap: 12px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  
  label {
    margin-bottom: 10px;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 1px;
    color: #000000;
  }
  
  input, textarea {
    padding: 14px;
    border: 3px solid #000000;
    border-radius: 0;
    font-family: inherit;
    font-size: 16px;
    background-color: #ffffff;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #E30613;
      box-shadow: 4px 4px 0px rgba(227, 6, 19, 0.2);
    }
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' | 'outline' }>`
  padding: 14px 24px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  border: 3px solid #000000;
  border-radius: 0;
  background-color: ${props => 
    props.variant === 'primary' ? '#000000' : 
    props.variant === 'danger' ? '#E30613' : 
    props.variant === 'outline' ? 'transparent' : '#e0e0e0'};
  color: ${props => 
    props.variant === 'primary' || props.variant === 'danger' ? '#ffffff' : '#000000'};
  transition: all 0.1s;
  flex: ${props => props.variant === 'outline' ? 'none' : 1};
  
  &:hover {
    background-color: ${props => 
      props.variant === 'primary' ? '#E30613' : 
      props.variant === 'danger' ? '#000000' : 
      props.variant === 'outline' ? '#000000' : '#d0d0d0'};
    color: ${props => props.variant === 'outline' ? '#ffffff' : ''};
    transform: translateY(-2px);
    box-shadow: 4px 4px 0px #000000;
  }

  &:active {
    transform: translateY(2px);
    box-shadow: 0px 0px 0px #000000;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const MarkerPin = styled.div`
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: move;
  transform-origin: bottom center;
  
  &:hover {
    transform: scale(1.2) translateY(-5px);
  }
`;

const ConstructivistMarker = ({ isCurrent, isNew }: { isCurrent?: boolean, isNew?: boolean }) => (
  <svg width="48" height="64" viewBox="0 0 40 54" style={{ filter: isCurrent ? 'drop-shadow(0px 0px 10px rgba(227,6,19,0.8)) drop-shadow(4px 4px 0px rgba(0,0,0,1))' : 'drop-shadow(4px 4px 0px rgba(0,0,0,1))' }}>
    <polygon points="20,54 0,24 0,0 40,0 40,24" fill={isCurrent ? "#000000" : isNew ? "#2ecc71" : "#E30613"} stroke="#000000" strokeWidth="4" strokeLinejoin="miter"/>
    <rect x="12" y="8" width="16" height="16" fill={isCurrent ? "#E30613" : "#000000"} />
  </svg>
);

const QRBox = styled.div`
  border: 4px solid #000000;
  padding: 20px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  box-shadow: 8px 8px 0px rgba(0,0,0,0.1);
`;

const LoginBox = styled.div`
  width: 400px;
  border: 4px solid #000;
  padding: 40px;
  background: #fff;
  box-shadow: 16px 16px 0px rgba(0,0,0,1);
  animation: ${slideUp} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 40px;
  
  h3 {
    color: #000;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 24px;
    margin-bottom: 10px;
  }
  
  p {
    font-size: 16px;
    line-height: 1.5;
  }
`;

const DraggableMarker = ({
  marker,
  isSelected,
  onStop,
  onClick,
}: {
  marker: MarkerData;
  isSelected: boolean;
  onStop: (e: unknown, data: { x: number; y: number }, marker: MarkerData) => void;
  onClick: (e: React.MouseEvent, marker: MarkerData) => void;
}) => {
  const nodeRef = useRef(null);
  return (
    <Draggable
      position={{x: 0, y: 0}}
      onStop={(e, data) => onStop(e, data, marker)}
      nodeRef={nodeRef}
    >
      <div ref={nodeRef} style={{ position: 'absolute', left: `${marker.x_percent}%`, top: `${marker.y_percent}%`, zIndex: isSelected ? 100 : 10 }}>
        <div style={{ transform: 'translate(-50%, -100%)' }}>
          <MarkerPin onClick={(e) => onClick(e, marker)} title={marker.title}>
            <ConstructivistMarker isCurrent={isSelected} isNew={marker.id === -1} />
          </MarkerPin>
        </div>
      </div>
    </Draggable>
  );
};

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isBrailleMode, setIsBrailleMode] = useState<boolean>(() => isBrailleModeEnabled());
  
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  
  const [mapFile, setMapFile] = useState<File | null>(null);
  const mapRef = useRef<HTMLImageElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedMarker) {
      setTitle(selectedMarker.title);
      setDescription(selectedMarker.description || '');
      setPhotoFile(null);
    }
  }, [selectedMarker]);

  const loadData = async () => {
    const map = await api.getMapBackground();
    if (map) setMapData(map);
    
    const marks = await api.getMarkers();
    setMarkers(marks);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Неверный пароль');
    }
  };

  const handleMapUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapFile) return;
    
    try {
      const newMap = await api.uploadMapBackground(mapFile);
      setMapData(newMap);
      setMapFile(null);
    } catch (error) {
      console.error('загрузка карты', error);
      alert('Ошибка загрузки карты');
    }
  };

  const handleMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const x_percent = (x / rect.width) * 100;
    const y_percent = (y / rect.height) * 100;
    
    setSelectedMarker({
      id: -1,
      x_percent,
      y_percent,
      title: 'НОВЫЙ ОБЪЕКТ',
      description: '',
      photo_url: null
    });
  };

  const handleMarkerClick = (e: React.MouseEvent, marker: MarkerData) => {
    e.stopPropagation();
    setSelectedMarker(marker);
  };

  const handleDragStop = async (_e: unknown, data: { x: number; y: number }, marker: MarkerData) => {
    if (!mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    
    const currentXPixels = (marker.x_percent / 100) * rect.width;
    const currentYPixels = (marker.y_percent / 100) * rect.height;
    
    const newXPixels = currentXPixels + data.x;
    const newYPixels = currentYPixels + data.y;
    
    const newXPercent = (newXPixels / rect.width) * 100;
    const newYPercent = (newYPixels / rect.height) * 100;
    
    if (marker.id === -1) {
      setSelectedMarker({
        ...marker,
        x_percent: newXPercent,
        y_percent: newYPercent
      });
    } else {
      try {
        await api.updateMarker(marker.id, {
          x_percent: newXPercent,
          y_percent: newYPercent
        });
        
        setMarkers(markers.map(m => 
          m.id === marker.id 
            ? { ...m, x_percent: newXPercent, y_percent: newYPercent } 
            : m
        ));
        
        if (selectedMarker && selectedMarker.id === marker.id) {
          setSelectedMarker(prev => prev ? { ...prev, x_percent: newXPercent, y_percent: newYPercent } : null);
        }
      } catch (error) {
        console.error('перетаскивание метки', error);
      }
    }
  };

  const handleSaveMarker = async () => {
    if (!selectedMarker) return;
    
    try {
      let savedMarker: MarkerData;
      
      if (selectedMarker.id === -1) {
        if (!Number.isFinite(selectedMarker.x_percent) || !Number.isFinite(selectedMarker.y_percent)) {
          alert('Неверные координаты точки. Поставьте точку на карте еще раз.');
          return;
        }

        savedMarker = await api.createMarker({
          x_percent: selectedMarker.x_percent,
          y_percent: selectedMarker.y_percent,
          title: title || 'БЕЗ НАЗВАНИЯ',
          description,
          photo_url: null
        });
        
        if (photoFile) {
          savedMarker = await api.uploadMarkerPhoto(savedMarker.id, photoFile);
        }
        
        setMarkers([...markers, savedMarker]);
        setSelectedMarker(savedMarker);
      } else {
        savedMarker = await api.updateMarker(selectedMarker.id, {
          title,
          description
        });
        
        if (photoFile) {
          savedMarker = await api.uploadMarkerPhoto(savedMarker.id, photoFile);
        }
        
        setMarkers(markers.map(m => m.id === savedMarker.id ? savedMarker : m));
        setSelectedMarker(savedMarker);
      }
    } catch (error) {
      console.error('сохранение метки', error);
      const maybeAxiosError = error as {
        message?: string;
        response?: { data?: { error?: unknown } };
      };
      const serverError = maybeAxiosError.response?.data?.error;
      const readableError = typeof serverError === 'string'
        ? serverError
        : maybeAxiosError.message || 'Неизвестная ошибка';
      alert(`Ошибка сохранения метки: ${readableError}`);
    }
  };

  const handleDeleteMarker = async () => {
    if (!selectedMarker) return;
    
    if (selectedMarker.id === -1) {
      setSelectedMarker(null);
      return;
    }
    
    if (window.confirm('Вы уверены, что хотите удалить эту метку?')) {
      try {
        await api.deleteMarker(selectedMarker.id);
        setMarkers(markers.filter(m => m.id !== selectedMarker.id));
        setSelectedMarker(null);
      } catch (error) {
        console.error('удаление метки', error);
      }
    }
  };

  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    for(let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      }
      else {
        line = testLine;
      }
    }
    context.fillText(line, x, y);
  };

  const handleDownloadQR = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!selectedMarker || selectedMarker.id === -1) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#E30613';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, 600);
    ctx.lineTo(0, 300);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(60, 60);
    ctx.scale(0.35, 0.35); 
    const paths = [
      "M93.62,595.28h146V302.15h-146Z",
      "M403.74,595.28H565.87L403.74,314.46Z",
      "M401.84,293.14H585.25L418.61,4.51l-91.7,158.84Z",
      "M252,293.14H391.43L321.7,172.37Z",
      "M0,0,89.11,154.34,178.22,0Z",
      "M93.62,293.14h146v-131L333.28,0H188.62l-95,164.57Z",
      "M407,302.15l80.25,139a71,71,0,0,0-20.72-139Z",
      "M248.68,302.15V595.28c80.58-.28,146.05-65.92,146.05-146.57S329.26,302.43,248.68,302.15Z",
      "M680.28,302.15c-80.82,0-146.57,65.75-146.57,146.56s65.75,146.57,146.57,146.57,146.57-65.75,146.57-146.57S761.1,302.15,680.28,302.15Z"
    ];
    paths.forEach(p => { ctx.fill(new Path2D(p)); });
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 50px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('FAB MAP', canvas.width - 60, 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 160px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('ВЫ ТУТ', canvas.width - 60, 240);

    const qrSize = 640;
    const qrX = canvas.width / 2 - qrSize / 2;
    const qrY = 650;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);

    const qrCanvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (qrCanvas) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 80px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    wrapText(ctx, (title || selectedMarker.title || 'ОБЪЕКТ').toUpperCase(), canvas.width / 2, 1450, 900, 90);

    ctx.fillStyle = '#E30613';
    ctx.font = 'bold 40px "Helvetica Neue", Helvetica, Arial, sans-serif';
    ctx.fillText('ОТСКАНИРУЙТЕ ДЛЯ НАВИГАЦИИ', canvas.width / 2, 1800);

    const link = document.createElement('a');
    link.download = `yadro-qr-${title || selectedMarker.title || 'building'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleBrailleModeToggle = (enabled: boolean) => {
    setIsBrailleMode(enabled);
    setBrailleModeEnabled(enabled);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f4f4' }}>
        <LoginBox>
          <h1 style={{ fontSize: '32px', margin: '0 0 30px 0', textTransform: 'uppercase', fontWeight: 900 }}>АДМИН-ПАНЕЛЬ</h1>
          <form onSubmit={handleLogin}>
            <FormGroup>
              <label>ПАРОЛЬ (admin123)</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                autoFocus
              />
            </FormGroup>
            <Button type="submit" variant="primary" style={{ width: '100%' }}>ВОЙТИ</Button>
          </form>
        </LoginBox>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Header>
        <HeaderTitle>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 826.85 595.28" style={{ height: '24px', fill: '#fff' }}>
            <path d="M93.62,595.28h146V302.15h-146Z" />
            <path d="M403.74,595.28H565.87L403.74,314.46Z" />
            <path d="M401.84,293.14H585.25L418.61,4.51l-91.7,158.84Z" />
            <path d="M252,293.14H391.43L321.7,172.37Z" />
            <path d="M0,0,89.11,154.34,178.22,0Z" />
            <path d="M93.62,293.14h146v-131L333.28,0H188.62l-95,164.57Z" />
            <path d="M407,302.15l80.25,139a71,71,0,0,0-20.72-139Z" />
            <path d="M248.68,302.15V595.28c80.58-.28,146.05-65.92,146.05-146.57S329.26,302.43,248.68,302.15Z" />
            <path d="M680.28,302.15c-80.82,0-146.57,65.75-146.57,146.56s65.75,146.57,146.57,146.57,146.57-65.75,146.57-146.57S761.1,302.15,680.28,302.15Z" />
          </svg>
          <span style={{ borderLeft: '2px solid #E30613', paddingLeft: '15px' }}>YADRO ADMIN</span>
        </HeaderTitle>
        <HeaderControls>
          <BrailleToggleLabel>
            <input
              type="checkbox"
              checked={isBrailleMode}
              onChange={(e) => handleBrailleModeToggle(e.target.checked)}
            />
            Брайль на сайте
          </BrailleToggleLabel>
          <Button variant="outline" style={{ padding: '8px 16px', fontSize: '12px' }} onClick={() => setIsAuthenticated(false)}>ВЫЙТИ</Button>
        </HeaderControls>
      </Header>
      
      <Workspace>
        <LeftPanel>
          <PanelSection>
            <PanelHeader>КАРТА</PanelHeader>
            <form onSubmit={handleMapUpload}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setMapFile(e.target.files ? e.target.files[0] : null)}
                  style={{ width: '100%', padding: '8px', border: '2px solid #000', backgroundColor: '#fff', fontSize: '12px' }}
                />
                <Button type="submit" variant="primary" disabled={!mapFile} style={{ padding: '10px' }}>ОБНОВИТЬ ФОН</Button>
              </div>
            </form>
          </PanelSection>

          <PanelHeader style={{ padding: '24px 24px 0 24px', marginBottom: '0' }}>ОБЪЕКТЫ ({markers.length})</PanelHeader>
          <MarkersList>
            {markers.length === 0 ? (
              <p style={{ color: '#666', fontSize: '14px', textTransform: 'uppercase', textAlign: 'center', marginTop: '40px' }}>Нет объектов</p>
            ) : (
              markers.map(marker => (
                <MarkerListItem 
                  key={marker.id} 
                  $active={selectedMarker?.id === marker.id}
                  onClick={() => setSelectedMarker(marker)}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{marker.title}</span>
                  <span style={{ color: selectedMarker?.id === marker.id ? '#E30613' : '#000' }}>→</span>
                </MarkerListItem>
              ))
            )}
          </MarkersList>
        </LeftPanel>

        <MapArea>
          {mapData ? (
            <MapContentWrapper>
              <MapImage 
                ref={mapRef}
                src={`${getBaseUrl()}${mapData.image_url}`} 
                alt="Фон карты"
                onClick={handleMapClick}
              />
              
              {markers.map(marker => (
                <DraggableMarker 
                  key={marker.id} 
                  marker={marker} 
                  isSelected={selectedMarker?.id === marker.id}
                  onStop={handleDragStop} 
                  onClick={handleMarkerClick} 
                />
              ))}
              
              {selectedMarker && selectedMarker.id === -1 && (
                <DraggableMarker 
                  key="temp" 
                  marker={selectedMarker} 
                  isSelected={true}
                  onStop={handleDragStop} 
                  onClick={() => {}} 
                />
              )}
            </MapContentWrapper>
          ) : (
            <EmptyState>
              <h3>КАРТА НЕ ЗАГРУЖЕНА</h3>
              <p>Слева можно залить картинку фона.</p>
            </EmptyState>
          )}
        </MapArea>

        {selectedMarker && (
          <RightPanel>
            <PanelSection style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', color: '#fff' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, letterSpacing: '1px' }}>
                {selectedMarker.id === -1 ? 'НОВЫЙ ОБЪЕКТ' : 'РЕДАКТИРОВАНИЕ'}
              </h2>
              <button 
                onClick={() => setSelectedMarker(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 }}
              >&times;</button>
            </PanelSection>
            
            <RightPanelContent>
              <FormGroup>
                <label>НАЗВАНИЕ</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="ВВЕДИТЕ НАЗВАНИЕ"
                  autoFocus
                />
              </FormGroup>
              
              <FormGroup>
                <label>ОПИСАНИЕ</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={5}
                  placeholder="ВВЕДИТЕ ОПИСАНИЕ"
                />
              </FormGroup>
              
              <FormGroup>
                <label>ФОТО ПЕРСПЕКТИВЫ</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setPhotoFile(e.target.files ? e.target.files[0] : null)} 
                />
                {selectedMarker.photo_url && !photoFile && (
                  <div style={{ marginTop: '15px', border: '3px solid #000', position: 'relative' }}>
                    <img 
                      src={`${getBaseUrl()}${selectedMarker.photo_url}`} 
                      alt="Текущее фото"
                      style={{ width: '100%', display: 'block' }} 
                    />
                  </div>
                )}
              </FormGroup>

              {selectedMarker.id !== -1 ? (
                <QRBox>
                  <h4 style={{ margin: 0, textTransform: 'uppercase', fontWeight: 900, width: '100%', textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '10px' }}>QR НАВИГАЦИЯ</h4>
                  <QRCodeCanvas
                    id="qr-code-canvas"
                    value={`${window.location.origin}/map?building=${selectedMarker.id}`}
                    size={180}
                    bgColor={"#ffffff"}
                    fgColor={"#000000"}
                    level={"H"}
                    imageSettings={{
                      src: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 1026.85 795.28"><rect x="-100" y="-100" width="1026.85" height="795.28" fill="#000000"/><path d="M93.62,595.28h146V302.15h-146Z" fill="#fff"/><path d="M403.74,595.28H565.87L403.74,314.46Z" fill="#fff"/><path d="M401.84,293.14H585.25L418.61,4.51l-91.7,158.84Z" fill="#fff"/><path d="M252,293.14H391.43L321.7,172.37Z" fill="#fff"/><path d="M0,0,89.11,154.34,178.22,0Z" fill="#fff"/><path d="M93.62,293.14h146v-131L333.28,0H188.62l-95,164.57Z" fill="#fff"/><path d="M407,302.15l80.25,139a71,71,0,0,0-20.72-139Z" fill="#fff"/><path d="M248.68,302.15V595.28c80.58-.28,146.05-65.92,146.05-146.57S329.26,302.43,248.68,302.15Z" fill="#fff"/><path d="M680.28,302.15c-80.82,0-146.57,65.75-146.57,146.56s65.75,146.57,146.57,146.57,146.57-65.75,146.57-146.57S761.1,302.15,680.28,302.15Z" fill="#fff"/></svg>')}`,
                      x: undefined,
                      y: undefined,
                      height: 44,
                      width: 44,
                      excavate: true,
                    }}
                  />
                  <Button variant="outline" onClick={handleDownloadQR} style={{ width: '100%', fontSize: '12px' }}>СКАЧАТЬ ПЛАКАТ</Button>
                </QRBox>
              ) : (
                <div style={{ padding: '20px', border: '3px dashed #ccc', textAlign: 'center', color: '#999', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px' }}>
                  Сохраните объект для генерации QR-кода
                </div>
              )}
            </RightPanelContent>

            <RightPanelFooter>
              {selectedMarker.id !== -1 && (
                <Button variant="danger" onClick={handleDeleteMarker} style={{ flex: 'none', padding: '14px 16px' }} title="Удалить">
                  ✕
                </Button>
              )}
              <Button variant="primary" onClick={handleSaveMarker}>СОХРАНИТЬ</Button>
            </RightPanelFooter>
          </RightPanel>
        )}
      </Workspace>
    </AdminLayout>
  );
};

export default AdminPage;
