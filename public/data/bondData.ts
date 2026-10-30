// 絆レベル累計EXPテーブル
export const BOND_EXP_TABLE: Record<number, number> = {
  1: 0, 2: 15, 3: 45, 4: 75, 5: 110,
  6: 145, 7: 180, 8: 220, 9: 260, 10: 300,
  11: 360, 12: 450, 13: 555, 14: 675, 15: 815,
  16: 975, 17: 1155, 18: 1360, 19: 1590, 20: 1845,
  21: 2130, 22: 2445, 23: 2790, 24: 3165, 25: 3575,
  26: 4020, 27: 4500, 28: 5020, 29: 5580, 30: 6180,
  31: 6825, 32: 7515, 33: 8250, 34: 9030, 35: 9860,
  36: 10740, 37: 11670, 38: 12655, 39: 13695, 40: 14790,
  41: 15945, 42: 17160, 43: 18435, 44: 19770, 45: 21170,
  46: 22635, 47: 24165, 48: 25765, 49: 27435, 50: 29175,
  51: 30990, 52: 32880, 53: 34845, 54: 36885, 55: 39005,
  56: 41205, 57: 43485, 58: 45850, 59: 48300, 60: 50835,
  61: 53460, 62: 56175, 63: 58980, 64: 61875, 65: 64865,
  66: 67950, 67: 71130, 68: 74410, 69: 77790, 70: 81270,
  71: 84855, 72: 88545, 73: 92340, 74: 96240, 75: 100250,
  76: 104370, 77: 108600, 78: 112945, 79: 117405, 80: 121980,
  81: 126675, 82: 131490, 83: 136425, 84: 141480, 85: 146660,
  86: 151965, 87: 157395, 88: 162955, 89: 168645, 90: 174465,
  91: 180420, 92: 186510, 93: 192735, 94: 199095, 95: 205595,
  96: 212235, 97: 219015, 98: 225940, 99: 233010, 100: 240225
};

export const SPRITE_CONFIG = {
  cols: 5,       // 1行あたりのコマ数
  width: 142,     // 1コマの横幅
  height: 112,    // 1コマの高さ
};

export const GIFT_EXP = {
  nb: 1.0,   // 通常 効果中
  na: 1.5,   // 通常 効果大
  ns: 2.0,   // 通常 効果特大
  sa: 1.5,   // 高級 効果大
  ss: 2.0,   // 高級 効果特大
} as const;

export const GIFT_LIST = [
  { name: 'レースの枕', category:'煌めき', baseExp: 120, spriteIdx: 0 },
  { name: 'ストリートオブヤンキー1巻', category:'煌めき', baseExp: 120, spriteIdx: 1 },
  { name: 'サミュエラ「ザ・ビヨンド」', category:'煌めき', baseExp: 120, spriteIdx: 2 },
  { name: 'レトロな卵の工芸品', category:'煌めき', baseExp: 120, spriteIdx: 3 },
  { name: 'ミルフィーユの正統派パフェ', category:'煌めき', baseExp: 120, spriteIdx: 4 },
  { name: 'エイ～ブックレア', category:'煌めき', baseExp: 120, spriteIdx: 5 },
  { name: 'おしゃれなくし', category:'煌めき', baseExp: 120, spriteIdx: 6 },
  { name: '栄養満載の総合ビタミンゼリー', category:'煌めき', baseExp: 120, spriteIdx: 7 },
  { name: '最高級の楓の盆栽', category:'煌めき', baseExp: 120, spriteIdx: 8 },
  { name: '裁縫キット', category:'煌めき', baseExp: 120, spriteIdx: 9 },
  { name: '音楽演奏会入場券', category:'煌めき', baseExp: 120, spriteIdx: 10 },
  { name: '1日3回ダンベルセット', category:'煌めき', baseExp: 120, spriteIdx: 11 },
  { name: 'ボードゲーム「ザ・人生」', category:'煌めき',baseExp: 120, spriteIdx: 12 },

  { name: 'ウェーブキャットの枕', category:'牡丹', baseExp: 40, spriteIdx: 20 },
  { name: 'ペロロの腹筋ローラー', category:'アサガオ', baseExp: 40, spriteIdx: 21 },
  { name: 'エーポッドプロ', category:'薔薇', baseExp: 40, spriteIdx: 22 },
  { name: '禁断の愛～許されないからこそ美しく～', category:'チューリップ', baseExp: 40, spriteIdx: 23 },
  { name: 'ゲームマガジン「ヒットガールズ」', category:'チューリップ', baseExp: 40, spriteIdx: 24 },
  { name: 'チェリーローズカラーのグロス', category:'桜', baseExp: 40, spriteIdx: 25 },
  { name: 'お肌を透明にするBBクリーム', category:'桜', baseExp: 40, spriteIdx: 26 },
  { name: 'ミリタリー用カモフラージュクリーム3種セット', category:'桜', baseExp: 40, spriteIdx: 27 },
  { name: '高級なクッキーセット', category:'スイセン', baseExp: 40, spriteIdx: 28 },
  { name: '『銃 可愛い 青春』', category:'チューリップ', baseExp: 40, spriteIdx: 29 },
  { name: '天体望遠鏡', category:'百日紅', baseExp: 40, spriteIdx: 30 },
  { name: 'ゲームガールカラー復刻版', category:'薔薇', baseExp: 40, spriteIdx: 31 },
  { name: 'MX-レーションC型デザート風味', category:'スイセン', baseExp: 40, spriteIdx: 32 },
  { name: '抹茶味の瓶ラムネ', category:'スイセン', baseExp: 40, spriteIdx: 33 },
  { name: 'ゼリーズの枕', category:'牡丹', baseExp: 40, spriteIdx: 34 },
  { name: '跳躍探偵ウサギ～霧に包まれた温泉での滑落～', category:'チューリップ', baseExp: 40, spriteIdx: 35 },
  { name: 'O-フィット', category:'アサガオ', baseExp: 40, spriteIdx: 36 },
  { name: '埋蔵金の地図', category:'タンポポ', baseExp: 40, spriteIdx: 37 },
  { name: 'コスプレ用ぐるぐるメガネ', category:'百日紅', baseExp: 40, spriteIdx: 38 },
  { name: '世界で最も無駄な絡繰りボックス', category:'タンポポ', baseExp: 40, spriteIdx: 39 },
  { name: 'リボンのついた熊のぬいぐるみ', category:'百日紅', baseExp: 40, spriteIdx: 40 },
  { name: '映画の前売りペアチケット', category:'ユリ', baseExp: 40, spriteIdx: 41 },
  { name: '30色の絵の具セット', category:'百日紅', baseExp: 40, spriteIdx: 42 },
  { name: '古典の詩集', category:'チューリップ', baseExp: 40, spriteIdx: 43 },
  { name: '可愛い食器セット', category:'キンセンカ', baseExp: 40, spriteIdx: 44 },
  { name: '頭脳開発キューブパズル', category:'百日紅', baseExp: 40, spriteIdx: 45 },
  { name: '大きなホールケーキ', category:'スイセン', baseExp: 40, spriteIdx: 46 },
  { name: 'ハイクラスビュッフェ招待券', category:'ユリ', baseExp: 40, spriteIdx: 47 },
  { name: '食虫植物の植木鉢', category:'桔梗', baseExp: 40, spriteIdx: 48 },
  { name: '高級そうな欲望のつぼ', category:'タンポポ', baseExp: 40, spriteIdx: 49 },
  { name: 'ぜんまい式オルゴール', category:'タンポポ', baseExp: 40, spriteIdx: 50 },
  { name: '刺繍付きのハンカチ', category:'モクレン', baseExp: 40, spriteIdx: 51 },
  { name: '百科事典', category:'チューリップ', baseExp: 40, spriteIdx: 52 },
  { name: 'ザ・サプリメント', category:'ツツジ', baseExp: 40, spriteIdx: 53 },
  { name: '夏模様の浮き輪', category:'翡翠花', baseExp: 40, spriteIdx: 54 }
] as const;

export const CHARACTER_LIST = [
  {
    id: 'airi',
    name: 'アイリ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'airi_band',
    name: 'アイリ（バンド）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      '大きなホールケーキ': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'aoba',
    name: 'アオバ',
    giftRatings: {
      '裁縫キット': 'ss',
      '栄養満載の総合ビタミンゼリー': 'sa',
      '音楽演奏会入場券': 'sa',
      'ハイクラスビュッフェ招待券': 'na',
      '映画の前売りペアチケット': 'nb',
      '可愛い食器セット': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'akane',
    name: 'アカネ',
    giftRatings: {
      '裁縫キット': 'sa',
      '可愛い食器セット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'akane_bunnygirl',
    name: 'アカネ（バニーガール）',
    giftRatings: {
      '裁縫キット': 'ss',
      '可愛い食器セット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'akari',
    name: 'アカリ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'ハイクラスビュッフェ招待券': 'na',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'akari_newyear',
    name: 'アカリ（正月）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'ハイクラスビュッフェ招待券': 'na',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ako',
    name: 'アコ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      'ザ・サプリメント': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ako_dress',
    name: 'アコ（ドレス）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'レトロな卵の工芸品': 'sa',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      'ザ・サプリメント': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'azusa',
    name: 'アズサ',
    giftRatings: {
      'おしゃれなくし': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      'ウェーブキャットの枕': 'nb',
      'ペロロの腹筋ローラー': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'azusa_swimsuit',
    name: 'アズサ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
      '夏模様の浮き輪': 'na',
      'ウェーブキャットの枕': 'nb',
      'ペロロの腹筋ローラー': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'azusa_racing',
    name: 'アズサ（レーシング）',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'レースの枕': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      'ウェーブキャットの枕': 'nb',
      'ペロロの腹筋ローラー': 'nb',
      'ゼリーズの枕': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'asuna',
    name: 'アスナ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'asuna_bunnygirl',
    name: 'アスナ（バニーガール）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      '大きなホールケーキ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'asuna_schooluniform',
    name: 'アスナ（制服）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'atsuko',
    name: 'アツコ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      '百科事典': 'na',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'atsuko_swimsuit',
    name: 'アツコ（水着）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '百科事典': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ayane',
    name: 'アヤネ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ayane_swimsuit',
    name: 'アヤネ（水着）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'arisu',
    name: 'アリス',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ゲームマガジン「ヒットガールズ」': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'arisu_maid',
    name: 'アリス（メイド）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'ボードゲーム「ザ・人生」': 'ss',
      'ゲームマガジン「ヒットガールズ」': 'na',
      '頭脳開発キューブパズル': 'na',
      '天体望遠鏡': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'arisu_battle',
    name: 'アリス（臨戦）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'おしゃれなくし': 'sa',
      'ゲームガールカラー復刻版': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '天体望遠鏡': 'nb',
      'O-フィット': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'aru',
    name: 'アル',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'aru_newyear',
    name: 'アル（正月）',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'aru_dress',
    name: 'アル（ドレス）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'na',
      '高級そうな欲望のつぼ': 'na',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'anna',
    name: 'アンナ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '百科事典': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'iori',
    name: 'イオリ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      'MX-レーションC型デザート風味': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '高級なクッキーセット': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'iori_swimsuit',
    name: 'イオリ（水着）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      'MX-レーションC型デザート風味': 'na',
      '夏模様の浮き輪': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '高級なクッキーセット': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'izuna',
    name: 'イズナ',
    giftRatings: {
      'おしゃれなくし': 'sa',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'izuna_swimsuit',
    name: 'イズナ（水着）',
    giftRatings: {
      'おしゃれなくし': 'sa',
      '刺繍付きのハンカチ': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'izumi',
    name: 'イズミ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '抹茶味の瓶ラムネ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'izumi_swimsuit',
    name: 'イズミ（水着）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '抹茶味の瓶ラムネ': 'na',
      '夏模様の浮き輪': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'izumi_newyear',
    name: 'イズミ（正月）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '抹茶味の瓶ラムネ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ichika',
    name: 'イチカ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'エイ～ブックレア': 'sa',
      'おしゃれなくし': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'エーポッドプロ': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ichika_swimsuit',
    name: 'イチカ（水着）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'エイ～ブックレア': 'sa',
      'チェリーローズカラーのグロス': 'na',
      '夏模様の浮き輪': 'na',
      'エーポッドプロ': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ibuki',
    name: 'イブキ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'ボードゲーム「ザ・人生」': 'ss',
      '高級なクッキーセット': 'na',
      'リボンのついた熊のぬいぐるみ': 'na',
      '30色の絵の具セット': 'na',
      '天体望遠鏡': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ibuki_swimsuit',
    name: 'イブキ（水着）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      '30色の絵の具セット': 'na',
      '夏模様の浮き輪': 'na',
      '高級なクッキーセット': 'nb',
      '天体望遠鏡': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'iroha',
    name: 'イロハ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      'ゲームマガジン「ヒットガールズ」': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゲームガールカラー復刻版 ': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'O-フィット': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'iroha_swimsuit',
    name: 'イロハ（水着）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ui',
    name: 'ウイ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ui_swimsuit',
    name: 'ウイ（水着）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '『銃 可愛い 青春』': 'na',
      '埋蔵金の地図': 'na',
      '古典の詩集': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'utaha',
    name: 'ウタハ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '天体望遠鏡': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'utaha_cheerleader',
    name: 'ウタハ（応援団）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '天体望遠鏡': 'na',
      'エーポッドプロ': 'nb',
      'ゲームガールカラー復刻版': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'umika',
    name: 'ウミカ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'eimi',
    name: 'エイミ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      'ぜんまい式オルゴール': 'na',
      'エーポッドプロ': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'eimi_swimsuit',
    name: 'エイミ（水着）',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      'ぜんまい式オルゴール': 'na',
      '夏模様の浮き輪': 'na',
      'エーポッドプロ': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'eimi_battle',
    name: 'エイミ（臨戦）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
      '埋蔵金の地図': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'eri',
    name: 'エリ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
      '30色の絵の具セット': 'na',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'erika',
    name: 'エリカ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '刺繍付きのハンカチ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'erina',
    name: 'エリナ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      'おしゃれなくし': 'sa',
      'ゲームマガジン「ヒットガールズ」': 'na',
      '高級なクッキーセット': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'otogi',
    name: 'オトギ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '1日3回ダンベルセット': 'sa',
      'O-フィット': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '埋蔵金の地図': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kaede',
    name: 'カエデ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      'コスプレ用ぐるぐるメガネ': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '天体望遠鏡': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kazusa',
    name: 'カズサ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kazusa_band',
    name: 'カズサ（バンド）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      '大きなホールケーキ': 'na',
      'エーポッドプロ': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kasumi',
    name: 'カスミ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '埋蔵金の地図': 'na',
      '天体望遠鏡': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kasumi_swimsuit',
    name: 'カスミ（水着）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '夏模様の浮き輪': 'na',
      '天体望遠鏡': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kanoe',
    name: 'カノエ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'エーポッドプロ': 'na',
      '禁断の愛～許されないからこそ美しく～': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kaho',
    name: 'カホ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kayoko',
    name: 'カヨコ',
    giftRatings: {
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kayoko_newyear',
    name: 'カヨコ（正月）',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      'エイ～ブックレア': 'sa',
      'おしゃれなくし': 'sa',
      'エーポッドプロ': 'na',
      '刺繍付きのハンカチ': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kayoko_dress',
    name: 'カヨコ（ドレス）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'エーポッドプロ': 'na',
      'ぜんまい式オルゴール': 'na',
      'ゲームガールカラー復刻版': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'karin',
    name: 'カリン',
    giftRatings: {
      '裁縫キット': 'ss',
      '頭脳開発キューブパズル': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'karin_schooluniform',
    name: 'カリン（制服）',
    giftRatings: {
      '裁縫キット': 'ss',
      '可愛い食器セット': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'karin_bunnygirl',
    name: 'カリン（バニーガール）',
    giftRatings: {
      '裁縫キット': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kanna',
    name: 'カンナ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ザ・サプリメント': 'na',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kanna_swimsuit',
    name: 'カンナ（水着）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kikyou',
    name: 'キキョウ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '『銃 可愛い 青春』': 'na',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      '古典の詩集': 'na',
      '百科事典': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kikyou_swimsuit',
    name: 'キキョウ（水着）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '『銃 可愛い 青春』': 'na',
      '百科事典': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kisaki',
    name: 'キサキ',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '可愛い食器セット': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '古典の詩集': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kisaki_swimsuit',
    name: 'キサキ（水着）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '刺繍付きのハンカチ': 'na',
      '夏模様の浮き輪': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kirara',
    name: 'キララ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリームス': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kirino',
    name: 'キリノ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '刺繍付きのハンカチ': 'na',
      '高級なクッキーセット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kirino_swimsuit',
    name: 'キリノ（水着）',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'O-フィット': 'na',
      '夏模様の浮き輪': 'na',
      'ペロロの腹筋ローラー': 'nb',
      '高級なクッキーセット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kurumi',
    name: 'クルミ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'お肌を透明にするBBクリーム': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kei',
    name: 'ケイ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'チェリーローズカラーのグロス': 'na',
      'ゲームガールカラー復刻版': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kokona',
    name: 'ココナ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kokoro',
    name: 'ココロ',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      '裁縫キット': 'sa',
      '埋蔵金の地図': 'na',
      '夏模様の浮き輪': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'O-フィット': 'nb',
      '可愛い食器セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kotama',
    name: 'コタマ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '天体望遠鏡': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kotama_camping',
    name: 'コタマ（キャンプ）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ボードゲーム「ザ・人生」': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '天体望遠鏡': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kotone',
    name: 'コトネ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '埋蔵金の地図': 'na',
      '夏模様の浮き輪': 'na',
      'エーポッドプロ': 'nb',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kotori',
    name: 'コトリ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '百科事典': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'kotori_cheerleader',
    name: 'コトリ（応援団）',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      '百科事典': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'O-フィット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'konoka',
    name: 'コノカ',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'レースの枕': 'sa',
      'ペロロの腹筋ローラー': 'na',
      'ウェーブキャットの枕': 'nb',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゼリーズの枕': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'O-フィット': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'koharu',
    name: 'コハル',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      '禁断の愛～許されないからこそ美しく～': 'na',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'koharu_swimsuit',
    name: 'コハル（水着）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '夏模様の浮き輪': 'na',
      '『銃 可愛い 青春』': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'koyuki',
    name: 'コユキ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
      '頭脳開発キューブパズル': 'na',
      '天体望遠鏡': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'koyuki_pajama',
    name: 'コユキ（パジャマ）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'レースの枕': 'sa',
      'ウェーブキャットの枕': 'na',
      'ゼリーズの枕': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saori',
    name: 'サオリ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saori_swimsuit',
    name: 'サオリ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      '夏模様の浮き輪': 'na',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saori_dress',
    name: 'サオリ（ドレス）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saki',
    name: 'サキ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saki_swimsuit',
    name: 'サキ（水着）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      '夏模様の浮き輪': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sakurako',
    name: 'サクラコ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '大きなホールケーキ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sakurako_idol',
    name: 'サクラコ（アイドル）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'ザ・サプリメント': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '古典の詩集': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'satsuki',
    name: 'サツキ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '百科事典': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'satsuki_swimsuit',
    name: 'サツキ（水着）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '百科事典': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saya',
    name: 'サヤ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'sa',
      'ザ・サプリメント': 'na',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saya_casual',
    name: 'サヤ（私服）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'コスプレ用ぐるぐるメガネ': 'na',
      '高級なクッキーセット': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sigure',
    name: 'シグレ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ザ・サプリメント': 'na',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sigure_hotspring',
    name: 'シグレ（温泉）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ザ・サプリメント': 'na',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shizuko',
    name: 'シズコ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'sa',
      'ザ・サプリメント': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shizuko_swimsuit',
    name: 'シズコ（水着）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'sa',
      'ザ・サプリメント': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shimiko',
    name: 'シミコ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'juri',
    name: 'ジュリ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      '30色の絵の具セット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'juri_parttimer',
    name: 'ジュリ（アルバイト）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '刺繍付きのハンカチ': 'na',
      'チェリーローズカラーのグロス': 'nb',
      '可愛い食器セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shun',
    name: 'シュン',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'お肌を透明にするBBクリーム': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shun_swimsuit',
    name: 'シュン（水着）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      '頭脳開発キューブパズル': 'na',
      '夏模様の浮き輪': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shun_kid',
    name: 'シュン（幼女）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'junko',
    name: 'ジュンコ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'junko_newyear',
    name: 'ジュンコ（正月）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'siroko',
    name: 'シロコ',
    giftRatings: {
      '1日3回ダンベルセット': 'sa',
      'ペロロの腹筋ローラー': 'na',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'siroko_riding',
    name: 'シロコ（ライディング）',
    giftRatings: {
      '1日3回ダンベルセット': 'sa',
      '埋蔵金の地図': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'siroko_swimsuit',
    name: 'シロコ（水着）',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'ペロロの腹筋ローラー': 'na',
      '夏模様の浮き輪': 'na',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'siroko_terror',
    name: 'シロコ＊テラー',
    giftRatings: {
      '1日3回ダンベルセット': 'sa',
      'ペロロの腹筋ローラー': 'na',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'suzumi',
    name: 'スズミ',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'suzumi_magical',
    name: 'スズミ（マジカル）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'レースの枕': 'sa',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'お肌を透明にするBBクリーム': 'na',
      'ウェーブキャットの枕': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'ゼリーズの枕': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'subaru',
    name: 'スバル',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '大きなホールケーキ': 'na',
      'ぜんまい式オルゴール': 'na',
      'エーポッドプロ': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sumire',
    name: 'スミレ',
    giftRatings: {
      '1日3回ダンベルセット': 'sa',
      'O-フィット': 'na',
      'ペロロの腹筋ローラー': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sumire_parttimer',
    name: 'スミレ（アルバイト）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      '1日3回ダンベルセット': 'sa',
      'O-フィット': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'seia',
    name: 'セイア',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'seia_swimsuit',
    name: 'セイア（水着）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'ゲームガールカラー復刻版': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '古典の詩集': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sena',
    name: 'セナ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'レースの枕': 'sa',
      'ウェーブキャットの枕': 'na',
      'ゼリーズの枕': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'sena_casual',
    name: 'セナ（私服）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ザ・サプリメント': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'serika',
    name: 'セリカ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '高級そうな欲望のつぼ': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'serika_newyear',
    name: 'セリカ（正月）',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '高級そうな欲望のつぼ': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'serika_swimsuit',
    name: 'セリカ（水着）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '高級そうな欲望のつぼ': 'na',
      '夏模様の浮き輪': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'serina',
    name: 'セリナ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ゼリーズの枕': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'serina_christmas',
    name: 'セリナ（クリスマス）',
    giftRatings: {
      'レースの枕': 'ss',
      '栄養満載の総合ビタミンゼリー': 'sa',
      'ゼリーズの枕': 'na',
      'ウェーブキャットの枕': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'takane',
    name: 'タカネ',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '古典の詩集': 'na',
      '刺繍付きのハンカチ': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chiaki',
    name: 'チアキ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chiaki_swimsuit',
    name: 'チアキ（水着）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'cherino',
    name: 'チェリノ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '高級そうな欲望のつぼ': 'na',
      '埋蔵金の地図': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '大きなホールケーキ': 'nb',
      '食虫植物の植木鉢': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'cherino_hotspring',
    name: 'チェリノ（温泉）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chise',
    name: 'チセ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chise_swimsuit',
    name: 'チセ（水着）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chinatsu',
    name: 'チナツ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chinatsu_hotspring',
    name: 'チナツ（温泉）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      'レトロな卵の工芸品': 'sa',
      '『銃 可愛い 青春』': 'na',
      'ぜんまい式オルゴール': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '古典の詩集': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'chihiro',
    name: 'チヒロ',
    giftRatings: {
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsukuyo',
    name: 'ツクヨ',
    giftRatings: {
      '最高級の楓の盆栽': 'sa',
      '食虫植物の植木鉢': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsukuyo_dress',
    name: 'ツクヨ（ドレス）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'おしゃれなくし': 'sa',
      'お肌を透明にするBBクリーム': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsubaki',
    name: 'ツバキ',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      'レースの枕': 'sa',
      'ウェーブキャットの枕': 'na',
      'ゼリーズの枕': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsubaki_guide',
    name: 'ツバキ（ガイド）',
    giftRatings: {
      'レースの枕': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'ウェーブキャットの枕': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゼリーズの枕': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsumugi',
    name: 'ツムギ',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      'エーポッドプロ': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsurugi',
    name: 'ツルギ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tsurugi_swimsuit',
    name: 'ツルギ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'toki',
    name: 'トキ',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'ペロロの腹筋ローラー': 'na',
      'O-フィット': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'toki_bunnygirl',
    name: 'トキ（バニーガール）',
    giftRatings: {
      '裁縫キット': 'ss',
      '1日3回ダンベルセット': 'ss',
      'ペロロの腹筋ローラー': 'na',
      'O-フィット': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'toki_battle',
    name: 'トキ（臨戦）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'エイ～ブックレア': 'sa',
      'ゲームガールカラー復刻版': 'na',
      '映画の前売りペアチケット': 'na',
      'エーポッドプロ': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tomoe',
    name: 'トモエ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '古典の詩集': 'na',
      '『銃 可愛い 青春』': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'tomoe_qipao',
    name: 'トモエ（チーパオ）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'おしゃれなくし': 'sa',
      'チェリーローズカラーのグロス': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '刺繍付きのハンカチ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nagisa',
    name: 'ナギサ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ぜんまい式オルゴール': 'na',
      '高級なクッキーセット': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nagisa_swimsuit',
    name: 'ナギサ（水着）',
    giftRatings: {
      'レースの枕': 'ss',
      'レトロな卵の工芸品': 'sa',
      '高級なクッキーセット': 'na',
      '夏模様の浮き輪': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nagusa',
    name: 'ナグサ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      '古典の詩集': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nagusa_swimsuit',
    name: 'ナグサ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'ミルフィーユの正統派パフェ': 'sa',
      '古典の詩集': 'na',
      '夏模様の浮き輪': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'natsu',
    name: 'ナツ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '埋蔵金の地図': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'natsu_band',
    name: 'ナツ（バンド）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      '大きなホールケーキ': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '埋蔵金の地図': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'niko',
    name: 'ニコ',
    giftRatings: {
      '裁縫キット': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      'MX-レーションC型デザート風味': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '高級なクッキーセット': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '可愛い食器セット': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'niya',
    name: 'ニヤ',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ボードゲーム「ザ・人生」': 'sa',
      '禁断の愛～許されないからこそ美しく～': 'na',
      'コスプレ用ぐるぐるメガネ': 'na',
      '高級そうな欲望のつぼ': 'na',
      '天体望遠鏡': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'neru',
    name: 'ネル',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'neru_schooluniform',
    name: 'ネル（制服）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'コスプレ用ぐるぐるメガネ': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '天体望遠鏡': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'neru_bunnygirl',
    name: 'ネル（バニーガール）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ゲームガールカラー復刻版': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'noa',
    name: 'ノア',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '古典の詩集': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'noa_pajama',
    name: 'ノア（パジャマ）',
    giftRatings: {
      'レースの枕': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      '古典の詩集': 'na',
      'ウェーブキャットの枕': 'nb',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゼリーズの枕': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nozomi',
    name: 'ノゾミ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'レトロな卵の工芸品': 'sa',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nodoka',
    name: 'ノドカ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '天体望遠鏡': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nodoka_hotspring',
    name: 'ノドカ（温泉）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '音楽演奏会入場券': 'sa',
      'ハイクラスビュッフェ招待券': 'na',
      '高級なクッキーセット': 'nb',
      '天体望遠鏡': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '映画の前売りペアチケット': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nonomi',
    name: 'ノノミ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'nonomi_swimsuit',
    name: 'ノノミ（水着）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      '夏模様の浮き輪': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hasumi',
    name: 'ハスミ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '大きなホールケーキ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hasumi_sportswear',
    name: 'ハスミ（体操服）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '大きなホールケーキ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hasumi_swimsuit',
    name: 'ハスミ（水着）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '大きなホールケーキ': 'na',
      '夏模様の浮き輪': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hanae',
    name: 'ハナエ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'お肌を透明にするBBクリーム': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hanae_christmas',
    name: 'ハナエ（クリスマス）',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      '栄養満載の総合ビタミンゼリー': 'sa',
      'O-フィット': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hanako',
    name: 'ハナコ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'sa',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '世界で最も無駄な絡繰りボックス': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hanako_swimsuit',
    name: 'ハナコ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'お肌を透明にするBBクリーム': 'ns',
      '夏模様の浮き輪': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'haruka',
    name: 'ハルカ',
    giftRatings: {
      '最高級の楓の盆栽': 'sa',
      '食虫植物の植木鉢': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'haruka_newyear',
    name: 'ハルカ（正月）',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      '食虫植物の植木鉢': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
    {
    id: 'haruka_dress',
    name: 'ハルカ（ドレス）',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ボードゲーム「ザ・人生」': 'sa',
      '食虫植物の植木鉢': 'na',
      '天体望遠鏡': 'nb',
      '埋蔵金の地図': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'haruna',
    name: 'ハルナ',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'haruna_newyear',
    name: 'ハルナ（正月）',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      '高級なクッキーセット': 'na',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'haruna_sportswear',
    name: 'ハルナ（体操服）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '1日3回ダンベルセット': 'sa',
      '高級なクッキーセット': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'O-フィット': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hare',
    name: 'ハレ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ゲームマガジン「ヒットガールズ」': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hare_camping',
    name: 'ハレ（キャンプ）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ゲームマガジン「ヒットガールズ」': 'na',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hikari',
    name: 'ヒカリ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'O-フィット': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hina',
    name: 'ヒナ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hina_swimsuit',
    name: 'ヒナ（水着）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hina_dress',
    name: 'ヒナ（ドレス）',
    giftRatings: {
      '音楽演奏会入場券': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
      '映画の前売りペアチケット': 'na',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hinata',
    name: 'ヒナタ',
    giftRatings: {
      '裁縫キット': 'ss',
      '最高級の楓の盆栽': 'sa',
      '食虫植物の植木鉢': 'na',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hinata_swimsuit',
    name: 'ヒナタ（水着）',
    giftRatings: {
      '裁縫キット': 'ss',
      '可愛い食器セット': 'na',
      '夏模様の浮き輪': 'na',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hibiki',
    name: 'ヒビキ',
    giftRatings: {
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'ゲームガールカラー復刻版': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hibiki_cheerleader',
    name: 'ヒビキ（応援団）',
    giftRatings: {
      '裁縫キット': 'ss',
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'ゲームガールカラー復刻版': 'nb',
      '可愛い食器セット': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hifumi',
    name: 'ヒフミ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'ペロロの腹筋ローラー': 'na',
      'ウェーブキャットの枕': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hifumi_swimsuit',
    name: 'ヒフミ（水着）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ペロロの腹筋ローラー': 'na',
      '夏模様の浮き輪': 'na',
      'ウェーブキャットの枕': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hifumi_racing',
    name: 'ヒフミ（レーシング）',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'レースの枕': 'sa',
      '1日3回ダンベルセット': 'sa',
      'ペロロの腹筋ローラー': 'na',
      'ウェーブキャットの枕': 'nb',
      'ゼリーズの枕': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'himari',
    name: 'ヒマリ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
      '埋蔵金の地図': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'himari_battle',
    name: 'ヒマリ（臨戦）',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '世界で最も無駄な絡繰りボックス': 'na',
      '埋蔵金の地図': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hiyori',
    name: 'ヒヨリ',
    giftRatings: {
      '裁縫キット': 'sa',
      '可愛い食器セット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hiyori_swimsuit',
    name: 'ヒヨリ（水着）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '大きなホールケーキ': 'na',
      '夏模様の浮き輪': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'pina',
    name: 'フィーナ',
    giftRatings: {
      '裁縫キット': 'ss',
      '映画の前売りペアチケット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'pina_guide',
    name: 'フィーナ（ガイド）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '音楽演奏会入場券': 'sa',
      '映画の前売りペアチケット': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ハイクラスビュッフェ招待券': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'fuuka',
    name: 'フウカ',
    giftRatings: {
      '裁縫キット': 'sa',
      '可愛い食器セット': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'fuuka_newyear',
    name: 'フウカ（正月）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      '裁縫キット': 'sa',
      '可愛い食器セット': 'na',
      'ザ・サプリメント': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'fubuki',
    name: 'フブキ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'fubuki_swimsuit',
    name: 'フブキ（水着）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      '抹茶味の瓶ラムネ': 'na',
      '夏模様の浮き輪': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      'O-フィット': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'fuyu',
    name: 'フユ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      '映画の前売りペアチケット': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hoshino',
    name: 'ホシノ',
    giftRatings: {
      'レースの枕': 'ss',
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hoshino_swimsuit',
    name: 'ホシノ（水着）',
    giftRatings: {
      'レースの枕': 'ss',
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hoshino_battle',
    name: 'ホシノ（臨戦）',
    giftRatings: {
      'レースの枕': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      'MX-レーションC型デザート風味': 'na',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'maki',
    name: 'マキ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      '30色の絵の具セット': 'na',
      '天体望遠鏡': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '頭脳開発キューブパズル': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'maki_camping',
    name: 'マキ（キャンプ）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'エイ～ブックレア': 'sa',
      'ゲームガールカラー復刻版 ': 'na',
      '30色の絵の具セット': 'na',
      'エーポッドプロ': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'makoto',
    name: 'マコト',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'na',
      '高級そうな欲望のつぼ': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'makoto_swimsuit',
    name: 'マコト（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '高級そうな欲望のつぼ': 'na',
      '夏模様の浮き輪': 'na',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '食虫植物の植木鉢': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mashiro',
    name: 'マシロ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mashiro_swimsuit',
    name: 'マシロ（水着）',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'MX-レーションC型デザート風味': 'na',
      '夏模様の浮き輪': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mari',
    name: 'マリー',
    giftRatings: {
      '最高級の楓の盆栽': 'sa',
      '刺繍付きのハンカチ': 'na',
      '食虫植物の植木鉢': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mari_sportswear',
    name: 'マリー（体操服）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '最高級の楓の盆栽': 'sa',
      '刺繍付きのハンカチ': 'na',
      '食虫植物の植木鉢': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mari_idol',
    name: 'マリー（アイドル）',
    giftRatings: {
      '裁縫キット': 'ss',
      '可愛い食器セット': 'na',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'marina',
    name: 'マリナ',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'marina_qipao',
    name: 'マリナ（チーパオ）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ボードゲーム「ザ・人生」': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '天体望遠鏡': 'nb',
      '埋蔵金の地図': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mika',
    name: 'ミカ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'お肌を透明にするBBクリーム': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mika_swimsuit',
    name: 'ミカ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'チェリーローズカラーのグロス': 'na',
      '夏模様の浮き輪': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'misaki',
    name: 'ミサキ',
    giftRatings: {
      'レースの枕': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'misaki_swimsuit',
    name: 'ミサキ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
      '夏模様の浮き輪': 'na',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'michiru',
    name: 'ミチル',
    giftRatings: {
      'レトロな卵の工芸品': 'sa',
      '埋蔵金の地図': 'na',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'michiru_dress',
    name: 'ミチル（ドレス）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '埋蔵金の地図': 'na',
      '高級そうな欲望のつぼ': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '刺繍付きのハンカチ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'midori',
    name: 'ミドリ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ゼリーズの枕': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'midori_maid',
    name: 'ミドリ（メイド）',
    giftRatings: {
      '裁縫キット': 'ss',
      '可愛い食器セット': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mina',
    name: 'ミナ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      '高級そうな欲望のつぼ': 'na',
      'ぜんまい式オルゴール': 'na',
      '埋蔵金の地図': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '食虫植物の植木鉢': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mine',
    name: 'ミネ',
    giftRatings: {
      'サミュエラ「ザ・ビヨンド」': 'ss',
      'チェリーローズカラーのグロス': 'na',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mine_idol',
    name: 'ミネ（アイドル）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'ウェーブキャットの枕': 'na',
      'チェリーローズカラーのグロス': 'na',
      'リボンのついた熊のぬいぐるみ': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'minori',
    name: 'ミノリ',
    giftRatings: {
      '栄養満載の総合ビタミンゼリー': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '『銃 可愛い 青春』': 'na',
      '百科事典': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      'ザ・サプリメント': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mimori',
    name: 'ミモリ',
    giftRatings: {
      'おしゃれなくし': 'sa',
      '裁縫キット': 'sa',
      '可愛い食器セット': 'na',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mimori_swimsuit',
    name: 'ミモリ（水着）',
    giftRatings: {
      '裁縫キット': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      '古典の詩集': 'na',
      '夏模様の浮き輪': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '可愛い食器セット': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'miyako',
    name: 'ミヤコ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '『銃 可愛い 青春』': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'miyako_swimsuit',
    name: 'ミヤコ（水着）',
    giftRatings: {
      'レースの枕': 'ss',
      '『銃 可愛い 青春』': 'na',
      '夏模様の浮き輪': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'miyu',
    name: 'ミユ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '刺繍付きのハンカチ': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'miyu_swimsuit',
    name: 'ミユ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '刺繍付きのハンカチ': 'na',
      '夏模様の浮き輪': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'miyo',
    name: 'ミヨ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      'レトロな卵の工芸品': 'sa',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '古典の詩集': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mutsuki',
    name: 'ムツキ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      'コスプレ用ぐるぐるメガネ': 'ns',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'mutsuki_newyear',
    name: 'ムツキ（正月）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'sa',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
    {
    id: 'ムツキ_ドレス',
    name: 'ムツキ（ドレス）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'megu',
    name: 'メグ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'meru',
    name: 'メル',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '30色の絵の具セット': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '天体望遠鏡': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '古典の詩集': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'moe',
    name: 'モエ',
    giftRatings: {
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'moe_swimsuit',
    name: 'モエ（水着）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '夏模様の浮き輪': 'na',
      'エーポッドプロ': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'momiji',
    name: 'モミジ',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      '禁断の愛～許されないからこそ美しく～': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'momoi',
    name: 'モモイ',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'ゲームガールカラー復刻版': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'momoi_maid',
    name: 'モモイ（メイド）',
    giftRatings: {
      'ボードゲーム「ザ・人生」': 'ss',
      'レースの枕': 'sa',
      'ゲームガールカラー復刻版': 'na',
      'ウェーブキャットの枕': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'ゼリーズの枕': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yakumo',
    name: 'ヤクモ',
    giftRatings: {
      'レトロな卵の工芸品': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '高級そうな欲望のつぼ': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '古典の詩集': 'nb',
      'ぜんまい式オルゴール': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuuka',
    name: 'ユウカ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '栄養満載の総合ビタミンゼリー': 'ss',
      '頭脳開発キューブパズル': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuuka_sportswear',
    name: 'ユウカ（体操服）',
    giftRatings: {
      '頭脳開発キューブパズル': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuuka_pajama',
    name: 'ユウカ（パジャマ）',
    giftRatings: {
      'レースの枕': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'エイ～ブックレア': 'sa',
      'ウェーブキャットの枕': 'na',
      'エーポッドプロ': 'nb',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'ゼリーズの枕': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yukari',
    name: 'ユカリ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      '刺繍付きのハンカチ': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yukari_swimsuit',
    name: 'ユカリ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      '刺繍付きのハンカチ': 'na',
      '夏模様の浮き輪': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuzu',
    name: 'ユズ',
    giftRatings: {
      'エイ～ブックレア': 'sa',
      'ゲームガールカラー復刻版': 'na',
      'エーポッドプロ': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuzu_maid',
    name: 'ユズ（メイド）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ゲームガールカラー復刻版': 'na',
      'エーポッドプロ': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      'O-フィット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yuzu_battle',
    name: 'ユズ（臨戦）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'ミリタリー用カモフラージュクリーム3種セット': 'na',
      'ゲームガールカラー復刻版': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'MX-レーションC型デザート風味': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yoshimi',
    name: 'ヨシミ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'sa',
      '高級なクッキーセット': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'yoshimi_band',
    name: 'ヨシミ（バンド）',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      '高級なクッキーセット': 'na',
      '大きなホールケーキ': 'na',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'チェリーローズカラーのグロス': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rana',
    name: 'ラナ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '百科事典': 'na',
      'エーポッドプロ': 'nb',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rabu',
    name: 'ラブ',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'レトロな卵の工芸品': 'sa',
      'ミルフィーユの正統派パフェ': 'sa',
      'ペロロの腹筋ローラー': 'na',
      '高級なクッキーセット': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      'O-フィット': 'nb',
      '埋蔵金の地図': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '大きなホールケーキ': 'nb',
      '高級そうな欲望のつぼ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rio',
    name: 'リオ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '天体望遠鏡': 'na',
      'エーポッドプロ': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rio_battle',
    name: 'リオ（臨戦）',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      '天体望遠鏡': 'na',
      'エーポッドプロ': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      '世界で最も無駄な絡繰りボックス': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'ritsu',
    name: 'リツ',
    giftRatings: {
      '最高級の楓の盆栽': 'ss',
      'ボードゲーム「ザ・人生」': 'sa',
      'コスプレ用ぐるぐるメガネ': 'na',
      '天体望遠鏡': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '食虫植物の植木鉢': 'nb',
      '高級そうな欲望のつぼ': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rumi',
    name: 'ルミ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      '可愛い食器セット': 'na',
      '刺繍付きのハンカチ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rei',
    name: 'レイ',
    giftRatings: {
      'エイ～ブックレア': 'ss',
      'エーポッドプロ': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      '埋蔵金の地図': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'reisa',
    name: 'レイサ',
    giftRatings: {
      'ミルフィーユの正統派パフェ': 'ss',
      'エイ～ブックレア': 'sa',
      'エーポッドプロ': 'na',
      '高級なクッキーセット': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '大きなホールケーキ': 'nb',
      'ぜんまい式オルゴール': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'reisa_magical',
    name: 'レイサ（マジカル）',
    giftRatings: {
      'ストリートオブヤンキー1巻': 'ss',
      'ミルフィーユの正統派パフェ': 'sa',
      'ボードゲーム「ザ・人生」': 'sa',
      'ゲームマガジン「ヒットガールズ」': 'na',
      '禁断の愛～許されないからこそ美しく～': 'nb',
      '高級なクッキーセット': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '天体望遠鏡': 'nb',
      'ゲームガールカラー復刻版': 'nb',
      'MX-レーションC型デザート風味': 'nb',
      '抹茶味の瓶ラムネ': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      'O-フィット': 'nb',
      'コスプレ用ぐるぐるメガネ': 'nb',
      'リボンのついた熊のぬいぐるみ': 'nb',
      '30色の絵の具セット': 'nb',
      '古典の詩集': 'nb',
      '頭脳開発キューブパズル': 'nb',
      '大きなホールケーキ': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'reijo',
    name: 'レイジョ',
    giftRatings: {
      '1日3回ダンベルセット': 'ss',
      'ザ・サプリメント': 'na',
      'ペロロの腹筋ローラー': 'nb',
      'O-フィット': 'nb',
      '埋蔵金の地図': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'rena',
    name: 'レナ',
    giftRatings: {
      '裁縫キット': 'ss',
      'サミュエラ「ザ・ビヨンド」': 'sa',
      'おしゃれなくし': 'sa',
      'リボンのついた熊のぬいぐるみ': 'na',
      '刺繍付きのハンカチ': 'na',
      'チェリーローズカラーのグロス': 'nb',
      'お肌を透明にするBBクリーム': 'nb',
      'ミリタリー用カモフラージュクリーム3種セット': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'renge',
    name: 'レンゲ',
    giftRatings: {
      '裁縫キット': 'ss',
      '音楽演奏会入場券': 'sa',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '映画の前売りペアチケット': 'na',
      '可愛い食器セット': 'na',
      'ハイクラスビュッフェ招待券': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'renge_swimsuit',
    name: 'レンゲ（水着）',
    giftRatings: {
      '裁縫キット': 'ss',
      'ストリートオブヤンキー1巻': 'sa',
      '禁断の愛～許されないからこそ美しく～': 'na',
      '夏模様の浮き輪': 'na',
      'ゲームマガジン「ヒットガールズ」': 'nb',
      '『銃 可愛い 青春』': 'nb',
      '跳躍探偵ウサギ～霧に包まれた温泉での滑落～': 'nb',
      '古典の詩集': 'nb',
      '可愛い食器セット': 'nb',
      '百科事典': 'nb',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'wakamo',
    name: 'ワカモ',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'wakamo_swimsuit',
    name: 'ワカモ（水着）',
    giftRatings: {
      'おしゃれなくし': 'ss',
      'リボンのついた熊のぬいぐるみ': 'na',
      '夏模様の浮き輪': 'na',
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'hatsune_miku',
    name: '初音ミク',
    giftRatings: {
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'misaka_mikoto',
    name: '御坂美琴',
    giftRatings: {
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'shokuhou_misaki',
    name: '食蜂操祈',
    giftRatings: {
    } as Record<string, keyof typeof GIFT_EXP>
  },
  {
    id: 'saten_ruiko',
    name: '佐天涙子',
    giftRatings: {
    } as Record<string, keyof typeof GIFT_EXP>
  },
] as const;

export type CharacterId = typeof CHARACTER_LIST[number]['id'];
