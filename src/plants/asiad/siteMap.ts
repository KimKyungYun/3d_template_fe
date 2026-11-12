import { Plane, Vector3 } from 'three';
import type { Vec3 } from '@/plants/model/types';

// 카카오맵 위성 사진(북쪽이 위, 보조경기장~1호기 캐노피 화면)에서 따낸 픽셀 좌표를 미터로 옮긴다.
// 축척은 보조경기장(트랙 장축 177m) 크기에 맞춘 추정값이고, 보조경기장 트랙 중심이 원점이다.

export const SITE_SCALE = 0.95;
const REF: [number, number] = [178, 135];

/** 위성 사진 픽셀 → 월드 좌표 (x: 동, z: 남) */
export const px = (x: number, y: number): Vec3 => [(x - REF[0]) * SITE_SCALE, 0, (y - REF[1]) * SITE_SCALE];

const m = (v: number) => v * SITE_SCALE;

/** 보조경기장 트랙 중심 기준 미터 좌표 (2호 배치도에서 읽은 값) */
const local = (x: number, z: number): Vec3 => [x, 0, z];

// 1호기 주변 고해상도 위성 사진(캐노피·반다비체육센터 화면). 캐노피 북동쪽 시작점을 위 사진의 같은 점에 맞추고
// 캐노피 양 끝 거리로 축척을 잡았다 — 두 사진의 반다비 위치가 몇 m 안에서 맞는다
const DETAIL_REF: [number, number] = [630, 52];
const DETAIL_ORIGIN = px(318, 256);
const DETAIL_SCALE = 0.485;

/** 고해상도 위성 사진 픽셀 → 월드 좌표 */
export const pxD = (x: number, y: number): Vec3 => [
  DETAIL_ORIGIN[0] + (x - DETAIL_REF[0]) * DETAIL_SCALE,
  0,
  DETAIL_ORIGIN[2] + (y - DETAIL_REF[1]) * DETAIL_SCALE,
];

const d = (v: number) => v * DETAIL_SCALE;

export interface SiteRoad {
  id: string;
  /** 중심선 꺾은선 */
  points: Vec3[];
  width: number;
  /** 양방향 합계 차로 수 */
  lanes: number;
}

export interface SiteRect {
  id: string;
  center: Vec3;
  /** 가로(x)·세로(z) 길이, m */
  size: [number, number];
  rotY: number;
}

export interface SiteBuilding {
  id: string;
  label: string;
  center: Vec3;
  size: [number, number, number];
  rotY: number;
  /** 옥상 태양광 패널 열을 얹는가 (사진 기준 장식, 발전소 용량에는 넣지 않음) */
  roofPanels?: boolean;
}

/** 공원 산책로·흙길 */
export interface SitePath {
  id: string;
  points: Vec3[];
  width: number;
  surface: 'paver' | 'dirt';
}

export type ZoneSurface = 'dryLawn' | 'sand' | 'fairway' | 'plaza';

/** 바닥 재질이 다른 구역 (다각형) */
export interface SiteZone {
  id: string;
  points: Vec3[];
  surface: ZoneSurface;
}

/** 주차장 태양광 카포트 */
export interface SiteCarport {
  id: string;
  center: Vec3;
  /** 가로(x)·세로(z) */
  size: [number, number];
  height: number;
}

const pts = (list: [number, number][]) => list.map(([x, y]) => pxD(x, y));

/** 받침판 범위 — 서쪽은 봉수대로 전체 폭이 들어오게 넓혔다 */
const BLOCK = { min: px(-28, -75), max: px(350, 640) };

const BONGSU_WIDTH = 36;
/** 봉수대로 중심 — 서쪽 가장자리가 받침판 끝에 닿게 둔다 (고해상도 사진의 동쪽 가장자리와도 맞는다) */
const BONGSU_X = BLOCK.min[0] + BONGSU_WIDTH / 2 + 1.2;
const GUKJE_WIDTH = 32;
/** 국제대로 북쪽 가장자리 — 봉수대로·하천변 도로가 여기서 끝난다 */
const GUKJE_NORTH_EDGE = pxD(0, 728)[2] - GUKJE_WIDTH / 2;

export const SITE = {
  /**
   * 1호기 산책로 캐노피 중심선 (고해상도 사진) — 보조경기장 남쪽 도로 바로 아래 북동쪽에서 시작해
   * 남서쪽 봉수대로 쪽으로 휘어 내려가고, 넓은 광장 끝이 남서쪽 국제대로 앞에 온다
   */
  canopyTrace: pts([
    [630, 52],
    [600, 85],
    [565, 125],
    [528, 165],
    [488, 205],
    [445, 240],
    [400, 270],
    [352, 298],
    [305, 322],
    [258, 346],
    [214, 372],
    [176, 402],
    [146, 437],
    [122, 476],
    [105, 518],
    [95, 560],
    [90, 592],
  ]),

  /** 2호기 보조경기장 트랙 중심 (원점) */
  auxStadium: px(178, 135),

  /** 보조경기장과 1호기 캐노피를 감싸는 받침판 범위 */
  block: BLOCK,

  roads: [
    // 서쪽 봉수대로 — 받침판 서쪽 끝에 붙여 두고, 남쪽은 국제대로 북쪽 가장자리에서 끝낸다 (T자 교차)
    {
      id: 'bongsu',
      points: [local(BONGSU_X, BLOCK.min[2]), local(BONGSU_X, GUKJE_NORTH_EDGE)],
      width: BONGSU_WIDTH,
      lanes: 8,
    },
    // 반다비체육센터 남쪽을 지나 북동쪽으로 오르는 4차로 — 캐노피 시작점이 남쪽 가장자리에 닿는다
    {
      id: 'bandabi-ro',
      points: pts([
        // 봉수대로 동쪽 가장자리에서 시작
        [35, 291],
        [200, 225],
        [400, 122],
        [560, 30],
        [700, -40],
      ]),
      width: 22,
      lanes: 4,
    },
    {
      id: 'gukje',
      points: [local(BLOCK.min[0], pxD(0, 728)[2]), local(BLOCK.max[0], pxD(0, 728)[2])],
      width: GUKJE_WIDTH,
      lanes: 8,
    },
    // 남동쪽 하천변 도로
    {
      id: 'simgok',
      // 국제대로 북쪽 가장자리에서 갈라져 나간다
      points: pts([
        [520, 694],
        [740, 606],
      ]),
      width: 14,
      lanes: 2,
    },
  ] as SiteRoad[],

  /** 공원 산책로 — 사진의 회색 포장 길과 남쪽 붉은 흙길 */
  paths: [
    // 도로 남쪽 보도 (도로와 나란한 밝은 띠)
    {
      id: 'sidewalk',
      surface: 'paver',
      width: 7,
      points: pts([
        [66, 322],
        [210, 262],
        [405, 160],
        [540, 88],
      ]),
    },
    // 도로 → 캐노피 아래를 가로질러 남동쪽으로 휘어 내려가는 산책로
    {
      id: 'cross',
      surface: 'paver',
      width: 5,
      points: pts([
        [152, 270],
        [160, 350],
        [172, 400],
        [185, 470],
        [200, 520],
        [230, 570],
        [270, 615],
        [330, 660],
        [390, 680],
        [420, 692],
      ]),
    },
    // 도로 → 캐노피 → 남쪽 마른 잔디밭으로 내려가는 길
    {
      id: 'link',
      surface: 'paver',
      width: 4,
      points: pts([
        [330, 205],
        [331, 330],
        [332, 440],
      ]),
    },
    // 마른 잔디밭을 비스듬히 가르는 곧은 길
    {
      id: 'diagonal',
      surface: 'paver',
      width: 4,
      points: pts([
        [240, 578],
        [415, 382],
        [530, 300],
      ]),
    },
    // 파크골프장 서쪽 산책로
    {
      id: 'golf-walk',
      surface: 'paver',
      width: 5,
      points: pts([
        [470, 455],
        [468, 560],
        [470, 690],
      ]),
    },
    // 남쪽 붉은 흙길
    {
      id: 'dirt',
      surface: 'dirt',
      width: 4,
      points: pts([
        [130, 646],
        [200, 656],
        [300, 678],
        [350, 690],
      ]),
    },
  ] as SitePath[],

  /** 바닥 재질 구역 */
  zones: [
    // 반다비체육센터 둘레 밝은 포장 광장
    {
      id: 'bandabi-plaza',
      surface: 'plaza',
      points: pts([
        [150, 18],
        [300, 22],
        [300, 135],
        [250, 150],
        [190, 215],
        [140, 215],
      ]),
    },
    // 캐노피 남쪽 마른 잔디밭 (길 사이 삼각 지대)
    {
      id: 'dry-lawn',
      surface: 'dryLawn',
      points: pts([
        [262, 470],
        [330, 446],
        [412, 392],
        [418, 470],
        [385, 560],
        [305, 625],
        [255, 575],
      ]),
    },
    // 파크골프장 모래 코스
    {
      id: 'park-golf',
      surface: 'sand',
      points: pts([
        [565, 300],
        [610, 230],
        [680, 130],
        [720, 90],
        [720, 610],
        [620, 650],
        [585, 680],
        [575, 560],
        [548, 430],
      ]),
    },
    // 파크골프장 안 잔디 페어웨이
    {
      id: 'fairway-1',
      surface: 'fairway',
      points: pts([
        [640, 170],
        [700, 120],
        [705, 260],
        [655, 330],
        [620, 300],
      ]),
    },
    {
      id: 'fairway-2',
      surface: 'fairway',
      points: pts([
        [600, 380],
        [660, 360],
        [690, 470],
        [640, 560],
        [595, 500],
      ]),
    },
    // 파크골프장 서쪽 잔디 삼각지
    {
      id: 'lawn-triangle',
      surface: 'fairway',
      points: pts([
        [485, 470],
        [545, 430],
        [560, 690],
        [490, 690],
      ]),
    },
  ] as SiteZone[],

  parkingLots: [
    { id: 'C', center: px(55, 30), size: [m(56), m(34)], rotY: 0 },
    { id: 'bandabi', center: pxD(97, 125), size: [d(74), d(140)], rotY: 0 },
    // 2호 배치도: 다이나믹 플라자(F) 북쪽 주차 열
    { id: 'west', center: local(-90, -34), size: [22, 34], rotY: 0 },
  ] as SiteRect[],

  /** 반다비체육센터 주차장의 태양광 카포트 두 열 (사진의 푸른 지붕) */
  carports: [
    { id: 'carport-w', center: pxD(68, 118), size: [d(14), d(100)], height: 3.2 },
    { id: 'carport-e', center: pxD(125, 120), size: [d(10), d(100)], height: 3.2 },
  ] as SiteCarport[],

  /**
   * 인천반다비체육센터 — 동쪽 본동(체육관)과 북서쪽으로 꺾여 내려가는 날개동, 둘을 잇는 로비.
   * 본동·날개동 옥상에 태양광 패널 열이 깔려 있다 (첫 항목이 이름표 기준)
   */
  buildings: [
    {
      id: 'bandabi',
      label: '반다비체육센터',
      center: pxD(238, 76),
      size: [d(78), 12, d(53)],
      rotY: -0.03,
      roofPanels: true,
    },
    { id: 'bandabi-wing-n', label: '', center: pxD(170, 52), size: [d(66), 9, d(28)], rotY: -0.15, roofPanels: true },
    { id: 'bandabi-wing-s', label: '', center: pxD(160, 108), size: [d(28), 9, d(66)], rotY: -0.3, roofPanels: true },
    { id: 'bandabi-lobby', label: '', center: pxD(198, 62), size: [d(22), 7, d(30)], rotY: 0 },
  ] as SiteBuilding[],
} as const;

/**
 * 받침판 네 변의 클리핑 평면 — 도로·산책로·바닥 구역처럼 가장자리를 넘어가는 바닥 요소를 반듯하게 잘라 낸다
 * (평면 쪽으로 음수 거리인 조각이 잘린다)
 */
export const BLOCK_CLIP: Plane[] = [
  new Plane(new Vector3(1, 0, 0), -BLOCK.min[0]),
  new Plane(new Vector3(-1, 0, 0), BLOCK.max[0]),
  new Plane(new Vector3(0, 0, 1), -BLOCK.min[2]),
  new Plane(new Vector3(0, 0, -1), BLOCK.max[2]),
];
