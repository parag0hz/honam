import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const MapPage = () => {
    const [map, setMap] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [position, setPosition] = useState({ lat: 37.5665, lng: 126.9780 }); // 기본 서울 좌표
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);

    // 카카오맵 스크립트 동적 로드
    useEffect(() => {
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_JS_KEY}&libraries=services`;
        script.async = true;
        script.onload = () => {
            console.log('카카오맵 SDK 로드 완료');
            getCurrentLocation();
        };
        script.onerror = () => {
            setError('카카오맵을 로드할 수 없습니다.');
            setLoading(false);
        };
        document.head.appendChild(script);

        return () => {
            // 컴포넌트 언마운트 시 스크립트 제거
            const existingScript = document.querySelector(`script[src*="dapi.kakao.com"]`);
            if (existingScript) {
                document.head.removeChild(existingScript);
            }
        };
    }, []);

    // 현재 위치 가져오기
    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPosition = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    };
                    console.log('현재 위치:', newPosition);
                    setPosition(newPosition);
                    initMap(newPosition);
                },
                (error) => {
                    console.error('위치 정보를 가져올 수 없습니다:', error);
                    setError('위치 정보를 가져올 수 없습니다. 기본 위치(서울)로 설정합니다.');
                    initMap(position);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            setError('이 브라우저는 위치 정보를 지원하지 않습니다.');
            initMap(position);
        }
    };

    // 지도 초기화
    const initMap = (pos) => {
        if (!window.kakao || !window.kakao.maps) {
            setError('카카오맵 SDK가 로드되지 않았습니다.');
            setLoading(false);
            return;
        }

        try {
            const container = mapRef.current;
            if (!container) return;

            const options = {
                center: new window.kakao.maps.LatLng(pos.lat, pos.lng),
                level: 4,
            };
            const mapInstance = new window.kakao.maps.Map(container, options);
            setMap(mapInstance);

            // 현재 위치 마커 (빨간색)
            const currentLocationMarker = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(pos.lat, pos.lng),
                map: mapInstance,
            });

            // 현재 위치 정보창
            const infoWindow = new window.kakao.maps.InfoWindow({
                content: '<div style="padding:5px;font-size:12px;">현재 위치</div>'
            });
            infoWindow.open(mapInstance, currentLocationMarker);

            console.log('지도 초기화 완료');
            fetchHospitals(pos, mapInstance);
        } catch (error) {
            console.error('지도 초기화 오류:', error);
            setError('지도를 초기화할 수 없습니다.');
            setLoading(false);
        }
    };

    // 기존 마커들 제거
    const clearMarkers = () => {
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];
    };

    // 주변 병원 가져오기 (카카오 로컬 API 사용)
    const fetchHospitals = async (pos, mapInstance) => {
        try {
            setLoading(true);
            console.log('병원 검색 시작:', pos);

            // 여러 키워드로 검색
            const keywords = ['정신건강의학과', '심리상담센터', '정신과'];
            let allPlaces = [];

            for (const keyword of keywords) {
                try {
                    const response = await axios.get("https://dapi.kakao.com/v2/local/search/keyword.json", {
                        params: { 
                            query: keyword, 
                            x: pos.lng, 
                            y: pos.lat, 
                            radius: 5000,
                            size: 15
                        },
                        headers: { 
                            Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_REST_KEY}` 
                        },
                    });

                    if (response.data.documents) {
                        allPlaces = [...allPlaces, ...response.data.documents];
                    }
                } catch (keywordError) {
                    console.error(`${keyword} 검색 오류:`, keywordError);
                }
            }

            // 중복 제거 (place_id 기준)
            const uniquePlaces = allPlaces.filter((place, index, self) => 
                index === self.findIndex(p => p.id === place.id)
            );

            console.log('검색된 병원 수:', uniquePlaces.length);
            setHospitals(uniquePlaces);

            // 기존 병원 마커들 제거
            clearMarkers();

            // 새로운 병원 마커들 추가
            if (mapInstance && uniquePlaces.length > 0) {
                uniquePlaces.forEach((place, index) => {
                    const marker = new window.kakao.maps.Marker({
                        position: new window.kakao.maps.LatLng(place.y, place.x),
                        map: mapInstance,
                    });

                    // 마커 클릭 이벤트
                    const infoWindow = new window.kakao.maps.InfoWindow({
                        content: `
                            <div style="padding:10px;font-size:12px;width:200px;">
                                <strong>${place.place_name}</strong><br/>
                                ${place.address_name}<br/>
                                ${place.phone ? `전화: ${place.phone}` : '전화번호 없음'}
                            </div>
                        `
                    });

                    window.kakao.maps.event.addListener(marker, 'click', () => {
                        infoWindow.open(mapInstance, marker);
                    });

                    markersRef.current.push(marker);
                });
            }

            setLoading(false);
        } catch (error) {
            console.error("병원 정보를 불러올 수 없습니다:", error);
            setError('병원 정보를 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
            setLoading(false);
        }
    };

    // 병원 목록 클릭 시 지도 중심 이동
    const onHospitalClick = (hospital) => {
        if (map) {
            const moveLatLon = new window.kakao.maps.LatLng(hospital.y, hospital.x);
            map.setCenter(moveLatLon);
            map.setLevel(3);
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* 지도 영역 */}
            <div 
                ref={mapRef} 
                id="map" 
                style={{ 
                    flex: 1, 
                    height: "100%",
                    minWidth: "60%"
                }}
            ></div>
            
            {/* 병원 목록 영역 */}
            <div style={{ 
                width: "400px", 
                overflowY: "auto", 
                padding: "20px", 
                background: "#f9f9f9",
                borderLeft: "1px solid #ddd"
            }}>
                <h2 style={{ margin: "0 0 20px 0", color: "#333" }}>
                    내 주변 심리상담 병원
                </h2>
                
                {error && (
                    <div style={{ 
                        color: "#d32f2f", 
                        background: "#ffebee", 
                        padding: "10px", 
                        borderRadius: "5px",
                        marginBottom: "15px"
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: "center", color: "#666" }}>
                        <p>주변 병원을 검색하는 중...</p>
                    </div>
                ) : hospitals.length > 0 ? (
                    hospitals.map((hospital, index) => (
                        <div 
                            key={hospital.id || index} 
                            onClick={() => onHospitalClick(hospital)}
                            style={{ 
                                marginBottom: "15px", 
                                padding: "15px", 
                                border: "1px solid #ddd", 
                                borderRadius: "8px",
                                background: "white",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                            }}
                        >
                            <h4 style={{ 
                                margin: "0 0 8px 0", 
                                color: "#1976d2",
                                fontSize: "16px"
                            }}>
                                {hospital.place_name}
                            </h4>
                            <p style={{ 
                                margin: "0 0 5px 0", 
                                color: "#666",
                                fontSize: "14px"
                            }}>
                                📍 {hospital.address_name}
                            </p>
                            <p style={{ 
                                margin: "0 0 5px 0", 
                                color: "#666",
                                fontSize: "14px"
                            }}>
                                📞 {hospital.phone || "전화번호 정보 없음"}
                            </p>
                            {hospital.category_name && (
                                <p style={{ 
                                    margin: "5px 0 0 0", 
                                    color: "#888",
                                    fontSize: "12px",
                                    fontStyle: "italic"
                                }}>
                                    {hospital.category_name}
                                </p>
                            )}
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: "center", color: "#666" }}>
                        <p>주변에 심리상담 병원을 찾을 수 없습니다.</p>
                        <p style={{ fontSize: "14px", marginTop: "10px" }}>
                            다른 지역을 검색해보세요.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPage;
