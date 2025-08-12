import React, { useEffect, useState, useCallback } from 'react';
import GoogleMapReact from 'google-map-react';
import logo from '../assets/mainlogo.png';
import { FaBars, FaMapMarkerAlt, FaRegClipboard } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './Map.css'; // MainPage.css에서 Map.css로 변경

// ===== 마커 컴포넌트 =====
const HospitalMarker = ({ lat, lng, hospital, onClick }) => (
    <div
        onClick={() => onClick(hospital)}
        style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            cursor: 'pointer',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '15px',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            minWidth: '20px',
            textAlign: 'center',
        }}
        title={hospital.place_name}
    >
        🏥
    </div>
);

const CurrentLocationMarker = () => (
    <div
        style={{
            position: 'absolute',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '5px 8px',
            borderRadius: '50%',
            fontSize: '12px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
        title="현재 위치"
    >
        📍
    </div>
);

// ===== 메인 컴포넌트 =====
const MapPage = () => {
    const [nickname, setNickname] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [position, setPosition] = useState(null); // 초기값을 null로 변경
    const [defaultPosition] = useState({ lat: 37.5665, lng: 126.9780 }); // 서울 시청 (기본값)
    const [loading, setLoading] = useState(true);
    const [locationLoading, setLocationLoading] = useState(true); // 위치 로딩 상태 분리
    const [error, setError] = useState(null);
    const [map, setMap] = useState(null);
    const [mapsApi, setMapsApi] = useState(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedNickname = localStorage.getItem('nickname');
        if (storedNickname) {
            setNickname(storedNickname);
        }
    }, []);

    // API 키 확인
    useEffect(() => {
        const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
        console.log('Google Maps API Key 확인:', apiKey ? '존재함' : '없음');

        if (!apiKey) {
            setError('Google Maps API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
            setLoading(false);
            setLocationLoading(false);
        }
    }, []);

    // 위치 정보 가져오기 - 컴포넌트 마운트 즉시 실행
    useEffect(() => {
        const getCurrentLocation = () => {
            if (!navigator.geolocation) {
                console.error('Geolocation not supported');
                setError('이 브라우저는 위치 정보를 지원하지 않습니다. 기본 위치(서울)로 설정합니다.');
                setPosition(defaultPosition);
                setLocationLoading(false);
                setLocationPermissionDenied(true);
                return;
            }

            console.log('위치 정보 요청 시작...');
            setLocationLoading(true);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const newPosition = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    console.log('현재 위치 성공:', newPosition);
                    setPosition(newPosition);
                    setLocationLoading(false);
                    setLocationPermissionDenied(false);

                    // 위치 획득 성공 시 에러 메시지 클리어
                    if (error && error.includes('위치 정보')) {
                        setError(null);
                    }
                },
                (err) => {
                    console.error('위치 정보 오류:', err.message, err.code);

                    let errorMessage = '';
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            errorMessage = '위치 접근이 거부되었습니다. 기본 위치(서울)로 설정합니다.';
                            setLocationPermissionDenied(true);
                            break;
                        case err.POSITION_UNAVAILABLE:
                            errorMessage = '위치 정보를 사용할 수 없습니다. 기본 위치(서울)로 설정합니다.';
                            break;
                        case err.TIMEOUT:
                            errorMessage = '위치 정보 요청 시간이 초과되었습니다. 기본 위치(서울)로 설정합니다.';
                            break;
                        default:
                            errorMessage = `위치 정보 오류: ${err.message}. 기본 위치(서울)로 설정합니다.`;
                    }

                    setError(errorMessage);
                    setPosition(defaultPosition);
                    setLocationLoading(false);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000, // 15초로 증가
                    maximumAge: 300000 // 5분간 캐시 허용
                }
            );
        };

        // 컴포넌트 마운트 즉시 위치 요청
        getCurrentLocation();
    }, [defaultPosition, error]);

    // Google Map API 로드 완료시 핸들러
    const handleApiLoaded = useCallback(({ map, maps }) => {
        console.log('Google Maps API 로드 완료');
        console.log('Maps API 객체:', maps);
        console.log('Places API 사용 가능:', !!maps.places);

        setMap(map);
        setMapsApi(maps);
        setMapLoaded(true);
    }, []);

    // Google Maps API 로드 오류 처리
    const handleMapError = useCallback((error) => {
        console.error('Google Maps 로드 오류:', error);
        setError('Google Maps를 로드할 수 없습니다. API 키와 설정을 확인하세요.');
        setLoading(false);
        setMapLoaded(false);
    }, []);

    // ===== Places 검색 함수 =====
    const searchHospitals = useCallback(async (pos, map, maps) => {
        console.log('병원 검색 시작:', pos);

        if (!map || !maps) {
            console.error('Google Maps API가 로드되지 않았습니다.');
            setError('구글맵 API를 로드할 수 없습니다.');
            setLoading(false);
            return;
        }

        if (!maps.places) {
            console.error('maps.places 미존재: libraries=places 누락 또는 API 권한 문제');
            setError('Google Places 라이브러리를 불러오지 못했습니다. API 키 설정과 Places API 활성화를 확인하세요.');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('Places 검색 실행 중...');

            const service = new maps.places.PlacesService(map);

            const runNearby = (opts) => new Promise((resolve) => {
                console.log('nearbySearch 요청:', opts);
                service.nearbySearch(
                    opts,
                    (results, status) => {
                        console.log('nearbySearch 결과:', status, results?.length || 0);
                        if (status === maps.places.PlacesServiceStatus.OK && results) {
                            resolve(results);
                        } else {
                            console.warn('검색 실패:', status);
                            resolve([]);
                        }
                    }
                );
            });

            const base = {
                location: new maps.LatLng(pos.lat, pos.lng),
                radius: 3000 // 3km로 범위 축소
            };

            // 더 구체적인 키워드로 검색
            const searchQueries = [
                { ...base, type: 'hospital', keyword: '정신건강의학과' },
                { ...base, type: 'hospital', keyword: '심리상담' },
                { ...base, type: 'doctor', keyword: '정신과' },
                { ...base, keyword: '상담센터' }
            ];

            console.log('다중 검색 실행...');
            const searchResults = await Promise.all(
                searchQueries.map(query => runNearby(query))
            );

            let allPlaces = searchResults.flat();
            console.log('초기 검색 결과 수:', allPlaces.length);

            if (allPlaces.length === 0) {
                console.log('결과 없음 - 범위 확대하여 재검색');
                const widerBase = { ...base, radius: 8000 }; // 8km로 확대
                const widerResults = await Promise.all([
                    runNearby({ ...widerBase, type: 'hospital', keyword: '병원' }),
                    runNearby({ ...widerBase, type: 'health', keyword: '의료' })
                ]);
                allPlaces = widerResults.flat();
                console.log('확대 검색 결과 수:', allPlaces.length);
            }

            // 결과 변환 + 중복 제거
            const formatted = allPlaces
                .filter(place => place && place.place_id)
                .map((place) => ({
                    id: place.place_id,
                    place_name: place.name || '이름 없음',
                    address_name: place.vicinity || place.formatted_address || '주소 정보 없음',
                    phone: place.formatted_phone_number || '전화번호 정보 없음',
                    x: place.geometry?.location?.lng?.() ?? 0,
                    y: place.geometry?.location?.lat?.() ?? 0,
                    category_name: Array.isArray(place.types) ? place.types.slice(0, 3).join(', ') : '',
                    rating: place.rating ?? '평점 없음',
                    business_status: place.business_status || 'UNKNOWN',
                }));

            const unique = formatted.filter((p, i, self) =>
                i === self.findIndex((q) => q.id === p.id)
            );

            console.log('최종 병원 검색 결과:', unique.length);
            setHospitals(unique);
            setLoading(false);

            if (unique.length === 0) {
                setError('주변에서 병원을 찾을 수 없습니다. 다른 지역을 확인해보세요.');
            }

        } catch (e) {
            console.error('병원 검색 중 오류:', e);
            setError(`병원 검색 오류: ${e.message}`);
            setHospitals([]);
            setLoading(false);
        }
    }, []);

    // 지도 + places + 위치가 모두 준비되면 검색 실행
    useEffect(() => {
        if (!mapLoaded || !map || !mapsApi) {
            console.log('지도 또는 API 미준비:', { mapLoaded, map: !!map, mapsApi: !!mapsApi });
            return;
        }

        if (!mapsApi.places) {
            console.error('Places API 없음');
            setError('Google Places API가 활성화되지 않았습니다. Google Cloud Console에서 Places API를 활성화하세요.');
            setLoading(false);
            return;
        }

        if (!position) {
            console.log('위치 정보 없음');
            return;
        }

        console.log('병원 검색 조건 만족 - 검색 시작');
        searchHospitals(position, map, mapsApi);
    }, [mapLoaded, map, mapsApi, position, searchHospitals]);

    // 위치 재요청 함수
    const requestLocationAgain = () => {
        setLocationLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newPosition = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                console.log('위치 재요청 성공:', newPosition);
                setPosition(newPosition);
                setLocationLoading(false);
                setLocationPermissionDenied(false);

                // 지도 중심 이동
                if (map) {
                    map.setCenter(newPosition);
                }
            },
            (err) => {
                console.error('위치 재요청 실패:', err);
                setError('위치 정보를 가져올 수 없습니다. 브라우저 설정에서 위치 권한을 확인해주세요.');
                setLocationLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0 // 캐시 사용하지 않고 새로 요청
            }
        );
    };

    const onHospitalClick = useCallback((hospital) => {
        if (!map) {
            console.warn('지도 객체가 없어서 이동할 수 없습니다.');
            return;
        }
        const pos = { lat: parseFloat(hospital.y), lng: parseFloat(hospital.x) };
        console.log('병원 클릭 - 지도 이동:', pos);
        map.setCenter(pos);
        map.setZoom(16);
    }, [map]);

    const onHospitalListClick = (hospital) => {
        console.log('병원 목록 클릭:', hospital.place_name);
        onHospitalClick(hospital);
    };

    // API 키가 없으면 렌더링하지 않음
    if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="main-container">
                <div style={{ padding: '40px', textAlign: 'center', color: '#d32f2f' }}>
                    <h2>Google Maps API 키가 설정되지 않았습니다</h2>
                    <p>.env 파일에 REACT_APP_GOOGLE_MAPS_API_KEY를 설정하세요.</p>
                </div>
            </div>
        );
    }

    // 위치 정보가 없을 때는 로딩 표시
    if (!position) {
        return (
            <div className="main-container">
                <header className="header">
                    <img src={logo} alt="마음자리 로고" className="logo" />
                    <span className="nickname-display">위치 정보 요청 중...</span>
                </header>
                <main className="page-main">
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        backgroundColor: '#f5f5f5'
                    }}>
                        {locationLoading ? (
                            <>
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        border: '4px solid #f3f3f3',
                                        borderTop: '4px solid #3498db',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        marginBottom: '20px'
                                    }}
                                />
                                <p style={{ fontSize: '18px', marginBottom: '10px' }}>현재 위치를 찾고 있습니다...</p>
                                <p style={{ fontSize: '14px', color: '#666' }}>위치 권한을 허용해주세요.</p>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <p style={{ fontSize: '16px', marginBottom: '20px', color: '#d32f2f' }}>
                                    위치 정보를 가져올 수 없습니다
                                </p>
                                <button
                                    onClick={requestLocationAgain}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    위치 정보 다시 요청
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="main-container">
            {/* 상단 헤더 */}
            <header className="header">
                <img
                    src={logo}
                    alt="마음자리 로고"
                    className="logo"
                    style={{ cursor: 'pointer' }} // 마우스 포인터 변경
                    onClick={() => navigate('/main')} // 클릭 시 /main으로 이동
                />
                <span className="nickname-display">
                    {nickname}님 주변 정보
                    {locationPermissionDenied && <span style={{ fontSize: '12px', color: '#888' }}>(기본 위치)</span>}
                </span>
            </header>

            <main className="page-main">
                <div className="map-wrap">
                    {/* 지도 로딩 중 표시 */}
                    {!mapLoaded && (
                        <div
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000,
                                flexDirection: 'column'
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '4px solid #f3f3f3',
                                    borderTop: '4px solid #3498db',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    marginBottom: '20px'
                                }}
                            />
                            <p>Google Maps 로딩 중...</p>
                        </div>
                    )}

                    <GoogleMapReact
                        bootstrapURLKeys={{
                            key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                            libraries: ['places']
                        }}
                        center={position}
                        zoom={15} // 줌 레벨을 15로 증가
                        yesIWantToUseGoogleMapApiInternals
                        onGoogleApiLoaded={handleApiLoaded}
                        onError={handleMapError}
                        options={{
                            fullscreenControl: false,
                            mapTypeControl: false,
                            streetViewControl: false,
                            zoomControl: true,
                            disableDefaultUI: false
                        }}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <CurrentLocationMarker lat={position.lat} lng={position.lng} />
                        {hospitals.map((h, i) => (
                            <HospitalMarker
                                key={h.id || i}
                                lat={+h.y}
                                lng={+h.x}
                                hospital={h}
                                onClick={onHospitalClick}
                            />
                        ))}
                    </GoogleMapReact>
                </div>

                {/* 병원 목록 */}
                <div
                    style={{
                        width: '400px',
                        overflowY: 'auto',
                        padding: '20px',
                        background: '#f9f9f9',
                        borderLeft: '1px solid #ddd',
                        height: '100%',
                    }}
                >
                    <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '18px', fontWeight: 'bold' }}>
                        내 주변 심리상담 병원
                        {locationPermissionDenied && (
                            <div style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginTop: '5px' }}>
                                기본 위치(서울) 기준 -
                                <button
                                    onClick={requestLocationAgain}
                                    style={{
                                        marginLeft: '5px',
                                        padding: '2px 8px',
                                        backgroundColor: '#1976d2',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '3px',
                                        cursor: 'pointer',
                                        fontSize: '11px'
                                    }}
                                >
                                    내 위치 사용
                                </button>
                            </div>
                        )}
                    </h2>

                    {error && (
                        <div
                            style={{
                                color: '#d32f2f',
                                background: '#ffebee',
                                padding: '12px',
                                borderRadius: '6px',
                                marginBottom: '15px',
                                fontSize: '14px',
                                border: '1px solid #ffcdd2'
                            }}
                        >
                            <strong>알림:</strong> {error}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                            <p>주변 병원을 검색하는 중...</p>
                            <div
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid #f3f3f3',
                                    borderTop: '2px solid #3498db',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite',
                                    margin: '10px auto',
                                }}
                            />
                        </div>
                    ) : (
                        <div>
                            {hospitals.length > 0 ? (
                                <div>
                                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                                        총 {hospitals.length}개의 병원을 찾았습니다
                                    </p>

                                    {hospitals.map((h, i) => (
                                        <div
                                            key={h.id || i}
                                            onClick={() => onHospitalListClick(h)}
                                            style={{
                                                marginBottom: '12px',
                                                padding: '15px',
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                background: 'white',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                                e.currentTarget.style.borderColor = '#1976d2';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                e.currentTarget.style.borderColor = '#ddd';
                                            }}
                                        >
                                            <h4 style={{ margin: '0 0 8px 0', color: '#1976d2', fontSize: '16px', fontWeight: 'bold' }}>
                                                {h.place_name}
                                            </h4>
                                            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>📍 {h.address_name}</p>
                                            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                                                📞 {h.phone || '전화번호 정보 없음'}
                                            </p>
                                            {h.rating && h.rating !== '평점 없음' && (
                                                <p style={{ margin: '0 0 5px 0', color: '#ff9800', fontSize: '14px' }}>⭐ {h.rating}/5.0</p>
                                            )}
                                            {h.category_name && (
                                                <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '12px', fontStyle: 'italic' }}>
                                                    {h.category_name}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#666', padding: '40px 20px' }}>
                                    <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                                        주변에 심리상담 병원을 찾을 수 없습니다.
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#888' }}>
                                        다른 지역을 검색해보세요.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* 하단 네비게이션 */}
            <nav className="bottom-nav">
                <button onClick={() => navigate('/home')}><FaBars /></button>
                <button onClick={() => navigate('/map')} className="active"><FaMapMarkerAlt /></button>
                <button onClick={() => navigate('/report')}><FaRegClipboard /></button>
            </nav>

            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default MapPage;