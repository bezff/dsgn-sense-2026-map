import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { MapData, MarkerData } from '../types';
import * as api from '../api';
import closeSound from '../fah.mp3';

const getBaseUrl = () => {
  return process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL.replace('/api', '') : '';
};

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const slideInMap = keyframes`
  from { opacity: 0; transform: scale(1.05); }
  to { opacity: 1; transform: scale(1); }
`;

const popInMarker = keyframes`
  0% { opacity: 0; transform: translate(-50%, -100%) scale(0); }
  100% { opacity: 1; transform: translate(-50%, -100%) scale(1); }
`;

const slideUpMobile = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const slideDownMobile = keyframes`
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
`;

const modalDesktop = keyframes`
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
`;

const modalDesktopClose = keyframes`
  from { opacity: 1; transform: scale(1) translateY(0); }
  to { opacity: 0; transform: scale(0.95) translateY(10px); }
`;

const revealText = keyframes`
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
`;

const bounce = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-10px); }
`;

const pulseRing = keyframes`
  0% { transform: scale(0.5); box-shadow: 0 0 0 0 rgba(227, 6, 19, 0.8); }
  70% { transform: scale(1); box-shadow: 0 0 0 40px rgba(227, 6, 19, 0); }
  100% { transform: scale(0.5); box-shadow: 0 0 0 0 rgba(227, 6, 19, 0); }
`;

const slideDownHeader = keyframes`
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
`;

const PageContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #ffffff;
  position: relative;
  animation: ${fadeIn} 0.4s ease-out;
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #000000;
  z-index: 50;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: ${slideDownHeader} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const LogoLink = styled.a`
  display: flex;
  align-items: center;
  height: 100%;
  text-decoration: none;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.8;
  }
  
  svg {
    height: 24px;
    width: auto;
  }
`;

const HeaderText = styled.span`
  color: #ffffff;
  font-weight: 900;
  font-size: 20px;
  margin-left: 15px;
  letter-spacing: 1px;
  text-transform: uppercase;
  border-left: 2px solid #E30613;
  padding-left: 15px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const MapContainer = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #1a1a1a;

  background-image: 
    linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222),
    linear-gradient(45deg, #222 25%, transparent 25%, transparent 75%, #222 75%, #222),
    linear-gradient(rgba(227, 6, 19, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(227, 6, 19, 0.05) 1px, transparent 1px);
  background-size: 20px 20px, 20px 20px, 40px 40px, 40px 40px;
  background-position: 0 0, 10px 10px, 0 0, 0 0;
  
  display: flex;
  justify-content: center;
  align-items: center;
`;

const MapContentWrapper = styled.div`
  position: relative;
  display: inline-block;
  box-shadow: 30px 30px 0px rgba(0,0,0,0.5);
  border: 6px solid #000000;
  background-color: #ffffff;
`;

const MapImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-width: 2000px;
  animation: ${slideInMap} 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
`;

const MarkerWrapper = styled.div<{ $delay: number }>`
  position: absolute;
  transform: translate(-50%, -100%);
  cursor: pointer;
  z-index: 10;
  width: 60px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  
  opacity: 0;
  animation: ${popInMarker} 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${props => props.$delay}s;
`;

const MarkerPin = styled.div`
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: bottom center;
  
  ${MarkerWrapper}:hover & {
    transform: scale(1.15) translateY(-5px);
  }
`;

const ConstructivistMarker = ({ isCurrent }: { isCurrent?: boolean }) => (
  <svg width="40" height="54" viewBox="0 0 40 54" style={{ filter: 'drop-shadow(6px 6px 0px rgba(0,0,0,1))' }}>
    <polygon points="20,54 0,24 0,0 40,0 40,24" fill={isCurrent ? "#000000" : "#E30613"} stroke="#000000" strokeWidth="4" strokeLinejoin="miter"/>
    <rect x="12" y="8" width="16" height="16" fill={isCurrent ? "#E30613" : "#000000"} />
  </svg>
);

const CurrentMarkerRing = styled.div`
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  z-index: 5;
  animation: ${pulseRing} 2s infinite;
`;

const YouAreHere = styled.div`
  position: absolute;
  top: -45px;
  background-color: #000000;
  color: #ffffff;
  padding: 8px 14px;
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 1px;
  border: 3px solid #E30613;
  white-space: nowrap;
  animation: ${bounce} 0.6s infinite alternate cubic-bezier(0.5, 0.05, 1, 0.5);
  z-index: 20;
  box-shadow: 6px 6px 0px rgba(0,0,0,1);
  
  &::after {
    content: '';
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8px 8px 0;
    border-style: solid;
    border-color: #E30613 transparent transparent transparent;
  }
`;

const ModalOverlay = styled.div<{ $isClosing: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  animation: ${props => props.$isClosing ? fadeOut : fadeIn} 0.3s ease-out forwards;

  @media (max-width: 768px) {
    align-items: flex-end;
    padding: 0;
  }
`;

const ModalContent = styled.div<{ $isClosing: boolean }>`
  background: #ffffff;
  border: 4px solid #000000;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 16px 16px 0px rgba(0,0,0,1);
  display: flex;
  flex-direction: column;
  animation: ${props => props.$isClosing ? modalDesktopClose : modalDesktop} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @media (max-width: 768px) {
    max-width: 100%;
    border-bottom: none;
    border-left: none;
    border-right: none;
    box-shadow: none;
    max-height: 85vh;
    animation: ${props => props.$isClosing ? slideDownMobile : slideUpMobile} 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: #000000;
  color: #ffffff;
  border: none;
  width: 40px;
  height: 40px;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  transition: background 0.2s, transform 0.2s;
  
  &:hover {
    background: #E30613;
    transform: scale(1.1) rotate(90deg);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalImage = styled.img`
  width: 100%;
  height: auto;
  max-height: 350px;
  object-fit: cover;
  border-bottom: 4px solid #000000;
  animation: ${fadeIn} 0.5s ease-out forwards;
`;

const NoImagePlaceholder = styled.div`
  height: 120px;
  background: #f0f0f0;
  border-bottom: 4px solid #000000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #000000;
  animation: ${fadeIn} 0.5s ease-out forwards;
  
  background-image: repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), repeating-linear-gradient(45deg, #e0e0e0 25%, #f0f0f0 25%, #f0f0f0 75%, #e0e0e0 75%, #e0e0e0);
  background-position: 0 0, 10px 10px;
  background-size: 20px 20px;
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const ModalTitle = styled.h2`
  margin: 0 0 12px 0;
  color: #000000;
  font-size: 28px;
  text-transform: uppercase;
  letter-spacing: -0.5px;
  font-weight: 900;
  opacity: 0;
  animation: ${revealText} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.1s;
`;

const ModalDescription = styled.p`
  color: #000000;
  line-height: 1.6;
  font-size: 16px;
  white-space: pre-wrap;
  margin: 0;
  opacity: 0;
  animation: ${revealText} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0.2s;
`;

const LoadingMessage = styled.div`
  font-size: 24px;
  font-weight: 900;
  text-transform: uppercase;
  color: #000000;
  letter-spacing: 2px;
  animation: ${fadeIn} 1s infinite alternate;
`;

const ZoomControls = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 40;
  
  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
  }
`;

const ZoomButton = styled.button`
  width: 50px;
  height: 50px;
  background-color: #000000;
  color: #ffffff;
  border: 3px solid #000000;
  font-size: 24px;
  font-weight: 900;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 6px 6px 0px rgba(0,0,0,0.3);
  transition: all 0.2s;
  
  &:hover {
    background-color: #E30613;
    transform: translateY(-2px);
    box-shadow: 8px 8px 0px rgba(0,0,0,0.4);
  }
  
  &:active {
    transform: translateY(2px);
    box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
  }
`;

const MapPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const buildingId = searchParams.get('building');
  const currentBuildingId = buildingId ? parseInt(buildingId, 10) : null;

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  const mapImageRef = useRef<HTMLImageElement>(null);
  const hasFocused = useRef(false);
  const closeSoundRef = useRef<HTMLAudioElement>(new Audio(closeSound));

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const audio = closeSoundRef.current;
    audio.preload = 'auto';

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const loadData = async () => {
    try {
      const [map, marks] = await Promise.all([
        api.getMapBackground(),
        api.getMarkers()
      ]);
      
      if (map) setMapData(map);
      setMarkers(marks);
    } catch (error) {
      console.error('карта/метки', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (marker: MarkerData) => {
    setSelectedMarker(marker);
  };

  const closeModal = () => {
    closeSoundRef.current.currentTime = 0;
    closeSoundRef.current.play().catch((error) => {
      console.warn('звук закрытия', error);
    });

    setIsClosing(true);
    setTimeout(() => {
      setSelectedMarker(null);
      setIsClosing(false);
    }, 300);
  };

  if (loading) {
    return <PageContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}><LoadingMessage>ЗАГРУЗКА...</LoadingMessage></PageContainer>;
  }

  if (!mapData) {
    return (
      <PageContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <LoadingMessage style={{ animation: 'none' }}>
          КАРТА НЕ НАЙДЕНА
        </LoadingMessage>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <LogoLink href="https://yadro.com" target="_blank" rel="noopener noreferrer">
          <svg xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 826.85 595.28">
            <path d="M93.62,595.28h146V302.15h-146Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M403.74,595.28H565.87L403.74,314.46Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M401.84,293.14H585.25L418.61,4.51l-91.7,158.84Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M252,293.14H391.43L321.7,172.37Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M0,0,89.11,154.34,178.22,0Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M93.62,293.14h146v-131L333.28,0H188.62l-95,164.57Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M407,302.15l80.25,139a71,71,0,0,0-20.72-139Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M248.68,302.15V595.28c80.58-.28,146.05-65.92,146.05-146.57S329.26,302.43,248.68,302.15Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
            <path d="M680.28,302.15c-80.82,0-146.57,65.75-146.57,146.56s65.75,146.57,146.57,146.57,146.57-65.75,146.57-146.57S761.1,302.15,680.28,302.15Z" transform="translate(0 0)" style={{fill:"#fff"}}/>
          </svg>
          <HeaderText>YADRO FAB</HeaderText>
        </LogoLink>
      </Header>

      <MapContainer>
        <TransformWrapper
          initialScale={1}
          minScale={0.3}
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
        >
          {({ zoomIn, zoomOut, resetTransform, setTransform }) => {
            if (!hasFocused.current && currentBuildingId && markers.length > 0 && mapImageRef.current) {
              const markerToFocus = markers.find(m => m.id === currentBuildingId);
              if (markerToFocus && mapImageRef.current.complete) {
                hasFocused.current = true;
                setTimeout(() => {
                  const mapWidth = mapImageRef.current!.offsetWidth;
                  const mapHeight = mapImageRef.current!.offsetHeight;
                  
                  const markerX = mapWidth * (markerToFocus.x_percent / 100);
                  const markerY = mapHeight * (markerToFocus.y_percent / 100);
                  
                  setTransform(-markerX + window.innerWidth / 2, -markerY + window.innerHeight / 2, 1.5, 800);
                  
                  setTimeout(() => setSelectedMarker(markerToFocus), 1200);
                }, 500);
              }
            }

            return (
              <>
                <ZoomControls>
                  <ZoomButton onClick={() => zoomIn()}>+</ZoomButton>
                  <ZoomButton onClick={() => zoomOut()}>-</ZoomButton>
                  <ZoomButton onClick={() => resetTransform()} style={{ fontSize: '16px' }}>⟲</ZoomButton>
                </ZoomControls>
                
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                  <MapContentWrapper>
                    <MapImage 
                      ref={mapImageRef}
                      src={`${getBaseUrl()}${mapData.image_url}`} 
                      alt="Карта площадки"
                    />
                    
                    {markers.map((marker, index) => {
                      const isCurrent = marker.id === currentBuildingId;
                      
                      return (
                        <MarkerWrapper
                          key={marker.id}
                          $delay={0.3 + index * 0.05}
                          style={{ 
                            left: `${marker.x_percent}%`, 
                            top: `${marker.y_percent}%` 
                          }}
                          onClick={() => handleMarkerClick(marker)}
                          title={marker.title}
                        >
                          {isCurrent && <CurrentMarkerRing />}
                          {isCurrent && <YouAreHere>ВЫ ТУТ</YouAreHere>}
                          <MarkerPin>
                            <ConstructivistMarker isCurrent={isCurrent} />
                          </MarkerPin>
                        </MarkerWrapper>
                      );
                    })}
                  </MapContentWrapper>
                </TransformComponent>
              </>
            );
          }}
        </TransformWrapper>
      </MapContainer>

      {selectedMarker && (
        <ModalOverlay $isClosing={isClosing} onClick={closeModal}>
          <ModalContent $isClosing={isClosing} onClick={e => e.stopPropagation()}>
            <CloseButton onClick={closeModal}>&times;</CloseButton>
            
            {selectedMarker.photo_url ? (
              <ModalImage 
                src={`${getBaseUrl()}${selectedMarker.photo_url}`} 
                alt={selectedMarker.title} 
              />
            ) : (
              <NoImagePlaceholder>
                <span style={{ background: '#fff', padding: '5px 10px', border: '3px solid #000' }}>НЕТ ФОТО</span>
              </NoImagePlaceholder>
            )}
            
            <ModalBody>
              <ModalTitle>{selectedMarker.title}</ModalTitle>
              <ModalDescription>
                {selectedMarker.description || 'ОПИСАНИЕ ОТСУТСТВУЕТ.'}
              </ModalDescription>
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default MapPage;
