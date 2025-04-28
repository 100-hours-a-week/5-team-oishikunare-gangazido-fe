import { create } from 'zustand';

const useMarkerStore = create((set) => ({
  markers: [],

  // 마커 목록 설정
  setMarkers: (newMarkers) => set({ markers: newMarkers }),

  // 마커 추가
  addMarkerToStore: (markerInfo) => 
    set((state) => ({ 
      markers: [...state.markers, markerInfo] 
    })),

  // 마커 제거
  removeMarkerFromStore: (markerPositionOrId) => 
    set((state) => {
      // ID로 제거하는 경우
      if (typeof markerPositionOrId === 'string') {
        return {
          markers: state.markers.filter(marker => marker.id !== markerPositionOrId)
        };
      }
      
      // 위치 객체로 제거하는 경우
      return {
        markers: state.markers.filter(marker => {
          const markerPos = marker.position;
          const targetPos = markerPositionOrId;
          
          return !(
            markerPos.lat === targetPos.lat && 
            markerPos.lng === targetPos.lng
          );
        })
      };
    }),
}));

export default useMarkerStore; 