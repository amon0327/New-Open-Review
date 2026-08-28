// 質問タイプ11: トーナメント式対戦ロジック
// 属性を総当たりで対戦させて、1位と2位を決定する

/**
 * 属性の設定
 * @param {string} id - 属性ID
 * @param {string} name - 属性名
 * @param {string} positive - プラス表現
 * @param {string} negative - マイナス表現
 */
export const DEFAULT_ATTRIBUTES = [
  {
    id: 'taste',
    name: '味',
    positive: '美味しい',
    negative: '味はいまいち'
  },
  {
    id: 'service',
    name: '接客',
    positive: '店員が親切',
    negative: '店員が冷たい'
  },
  {
    id: 'space',
    name: '空間',
    positive: '人目が気にならない空間',
    negative: '席同士が近く騒がしい'
  },
  {
    id: 'hygiene',
    name: '衛生',
    positive: '店内がきれい',
    negative: '店内が汚い'
  },
  {
    id: 'price',
    name: '価格',
    positive: '安い',
    negative: '高い'
  }
];

/**
 * 対戦の記録
 */
class TournamentState {
  constructor(attributes = DEFAULT_ATTRIBUTES, targetRanks = 2) {
    // console.log('TournamentState constructor called with:', { attributes, targetRanks });
    
    this.attributes = attributes;
    this.targetRanks = targetRanks; // 上位何位まで確定させるか
    this.matches = []; // 対戦履歴
    this.rankings = {}; // 属性ごとの勝敗記録
    this.currentRound = 1;
    this.confirmedRankings = []; // 確定した順位
    
    // 初期化
    this.attributes.forEach(attr => {
      // console.log('Initializing ranking for attribute:', attr);
      this.rankings[attr.id] = {
        wins: 0,
        losses: 0,
        opponents: new Set()
      };
    });
    
    // console.log('TournamentState initialized:', { rankings: this.rankings });
  }

  /**
   * 対戦を記録
   */
  recordMatch(winner, loser, questionIndex) {
    this.matches.push({
      questionIndex,
      round: this.currentRound,
      winner,
      loser
    });
    
    this.rankings[winner].wins++;
    this.rankings[winner].opponents.add(loser);
    this.rankings[loser].losses++;
    this.rankings[loser].opponents.add(winner);
  }

  /**
   * まだ対戦していない組み合わせを取得
   */
  getUnplayedMatches() {
    const unplayed = [];
    
    // console.log('getUnplayedMatches - attributes:', this.attributes);
    // console.log('getUnplayedMatches - rankings:', this.rankings);
    
    for (let i = 0; i < this.attributes.length; i++) {
      for (let j = i + 1; j < this.attributes.length; j++) {
        const attr1 = this.attributes[i].id;
        const attr2 = this.attributes[j].id;
        
        const played = this.hasPlayed(attr1, attr2);
        
        if (!played) {
          unplayed.push([attr1, attr2]);
        }
      }
    }
    
    // console.log('Unplayed matches found:', unplayed);
    return unplayed;
  }

  /**
   * 2つの属性が対戦済みか確認
   */
  hasPlayed(attr1, attr2) {
    return this.rankings[attr1].opponents.has(attr2) || 
           this.rankings[attr2].opponents.has(attr1);
  }

  /**
   * 次の対戦相手を決定する
   */
  getNextMatch(questionIndex) {
    // console.log('getNextMatch called with index:', questionIndex);
    
    // 最初の2問はランダムに未使用の属性から選ぶ
    if (questionIndex < 2) {
      const unplayed = this.getUnplayedMatches();
      // console.log('Unplayed matches for first 2 questions:', unplayed);
      if (unplayed.length === 0) {
        // console.error('No unplayed matches available');
        return null;
      }
      
      // 使用されていない属性を優先的に選ぶ
      const unusedAttrs = this.attributes.filter(attr => 
        !this.matches.some(m => m.winner === attr.id || m.loser === attr.id)
      ).map(attr => attr.id);
      
      // console.log('Unused attributes:', unusedAttrs);
      
      if (unusedAttrs.length >= 2) {
        // 未使用の属性から2つ選ぶ
        const shuffled = [...unusedAttrs].sort(() => Math.random() - 0.5);
        const result = [shuffled[0], shuffled[1]];
        // console.log('Returning unused pair:', result);
        return result;
      } else if (unplayed.length > 0) {
        // ランダムに選ぶ
        const randomIndex = Math.floor(Math.random() * unplayed.length);
        const result = unplayed[randomIndex];
        // console.log('Returning random unplayed pair:', result);
        return result;
      } else {
        // console.error('No unplayed matches available for questions 1-2');
        return null;
      }
    }
    
    // 3問目: 1問目と2問目の勝者同士を対戦
    if (questionIndex === 2 && this.matches.length >= 2) {
      const winner1 = this.matches[0].winner;
      const winner2 = this.matches[1].winner;
      
      if (!this.hasPlayed(winner1, winner2)) {
        return [winner1, winner2];
      }
    }
    
    // 4問目: 暫定1位 vs 未登場の属性
    if (questionIndex === 3 && this.matches.length >= 3) {
      const provisionalFirst = this.matches[2].winner; // 3問目の勝者
      const appeared = new Set();
      
      this.matches.forEach(m => {
        appeared.add(m.winner);
        appeared.add(m.loser);
      });
      
      const unappeared = this.attributes
        .map(attr => attr.id)
        .find(id => !appeared.has(id));
        
      if (unappeared && !this.hasPlayed(provisionalFirst, unappeared)) {
        return [provisionalFirst, unappeared];
      }
    }
    
    // 5問目以降: まだ対戦していない組み合わせを探す
    if (questionIndex >= 4) {
      // 未対戦の組み合わせを優先的に選択
      const unplayed = this.getUnplayedMatches();
      if (unplayed.length > 0) {
        // 勝利数が多い属性を含む対戦を優先
        const scores = {};
        this.attributes.forEach(attr => {
          scores[attr.id] = this.rankings[attr.id].wins;
        });
        
        // 勝利数でソートして、上位の属性を含む対戦を選択
        const sortedUnplayed = unplayed.sort((a, b) => {
          const scoreA = Math.max(scores[a[0]] || 0, scores[a[1]] || 0);
          const scoreB = Math.max(scores[b[0]] || 0, scores[b[1]] || 0);
          return scoreB - scoreA;
        });
        
        return sortedUnplayed[0];
      }
    }
    
    // デフォルト: ランダムに未対戦の組み合わせを返す
    const unplayed = this.getUnplayedMatches();
    if (unplayed.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * unplayed.length);
    return unplayed[randomIndex];
  }

  /**
   * 1位が確定したか判定
   */
  checkFirstPlace() {
    // 必要な質問数の後に判定
    const requiredQuestions = this.getRequiredQuestions();
    if (this.matches.length < Math.min(requiredQuestions - 1, this.attributes.length - 1)) return null;
    
    // 各属性の勝利数を集計
    const scores = {};
    this.attributes.forEach(attr => {
      scores[attr.id] = this.rankings[attr.id].wins;
    });
    
    // 最多勝利数の属性を取得
    const maxWins = Math.max(...Object.values(scores));
    const topAttributes = Object.keys(scores).filter(id => scores[id] === maxWins);
    
    // 1位が1つに確定した場合
    if (topAttributes.length === 1) {
      if (!this.confirmedRankings.includes(topAttributes[0])) {
        this.confirmedRankings.push(topAttributes[0]);
      }
      return topAttributes[0];
    }
    
    return null;
  }

  /**
   * 2位が確定したか判定
   */
  checkSecondPlace() {
    if (this.confirmedRankings.length === 0) return null;
    
    const firstPlace = this.confirmedRankings[0];
    
    // 1位を除いた属性で勝利数を比較
    const scores = {};
    this.attributes.forEach(attr => {
      if (attr.id !== firstPlace) {
        scores[attr.id] = this.rankings[attr.id].wins;
      }
    });
    
    // 最多勝利数の属性を取得
    const maxWins = Math.max(...Object.values(scores));
    const topAttributes = Object.keys(scores).filter(id => scores[id] === maxWins);
    
    // 2位が1つに確定した場合
    if (topAttributes.length === 1) {
      this.confirmedRankings.push(topAttributes[0]);
      return topAttributes[0];
    }
    
    // 複数候補がいる場合は、直接対決の結果を確認
    if (topAttributes.length === 2) {
      const match = this.matches.find(m => 
        (m.winner === topAttributes[0] && m.loser === topAttributes[1]) ||
        (m.winner === topAttributes[1] && m.loser === topAttributes[0])
      );
      
      if (match) {
        this.confirmedRankings.push(match.winner);
        return match.winner;
      }
    }
    
    return null;
  }

  /**
   * 必要な質問数を計算
   */
  getRequiredQuestions() {
    // 属性数と目標順位に基づいて必要な質問数を計算
    const n = this.attributes.length;
    const k = this.targetRanks;
    
    // 基本的な計算式：
    // - 1位を決めるのに最低 n-1 試合
    // - 2位を決めるのに追加で 2-3 試合
    // - 3位以降は各順位につき 1-2 試合追加
    
    if (k === 1) {
      return n - 1; // 単純なトーナメント
    } else if (k === 2 && n === 5) {
      return 6; // 特別なケース：5属性で上位2位
    } else if (k === 2) {
      return Math.min(n + 2, this.getCombinationCount());
    } else {
      // k位まで決める場合
      return Math.min(
        n + (k - 1) * 2,
        this.getCombinationCount()
      );
    }
  }

  /**
   * 全組み合わせ数を計算
   */
  getCombinationCount() {
    const n = this.attributes.length;
    return (n * (n - 1)) / 2;
  }

  /**
   * すべての質問を事前に生成
   */
  generateAllQuestions() {
    const questions = [];
    const totalQuestions = this.getRequiredQuestions();
    
    // 6問分の質問を事前に生成
    for (let i = 0; i < totalQuestions; i++) {
      const match = this.getNextMatch(i);
      if (match) {
        questions.push({
          questionIndex: i,
          attributes: match,
          match: null
        });
      }
    }
    
    return questions;
  }
}

/**
 * 質問を生成する
 */
export function generateComparisonQuestion(attr1, attr2, attributes, randomizeOrder = true) {
  // console.log('generateComparisonQuestion called with:', { attr1, attr2, attributes });
  
  const attribute1 = attributes.find(a => a.id === attr1);
  const attribute2 = attributes.find(a => a.id === attr2);
  
  // console.log('Found attributes:', { attribute1, attribute2 });
  
  if (!attribute1 || !attribute2) {
    // console.error('Could not find attributes:', { attr1, attr2, availableIds: attributes.map(a => a.id) });
    return null;
  }
  
  // 固定の文章パターンを定義
  const patterns = {
    'taste_service': {
      option_a: '味は美味しいが、店員の対応が冷たいお店',
      option_b: '店員は親切だが、味はいまいちなお店'
    },
    'taste_space': {
      option_a: '味は美味しいが、席同士が近くて騒がしいお店',
      option_b: 'プライベート感のある空間だが、味はいまいちなお店'
    },
    'taste_hygiene': {
      option_a: '味は美味しいが、店内が汚いお店',
      option_b: '店内はきれいだが、味はいまいちなお店'
    },
    'taste_price': {
      option_a: '味は美味しいが、値段が高いお店',
      option_b: '値段は安いが、味はいまいちなお店'
    },
    'service_space': {
      option_a: '店員は親切だが、席同士が近くて騒がしいお店',
      option_b: 'プライベート感のある空間だが、店員の対応が冷たいお店'
    },
    'service_hygiene': {
      option_a: '店員は親切だが、店内が汚いお店',
      option_b: '店内はきれいだが、店員の対応が冷たいお店'
    },
    'service_price': {
      option_a: '店員は親切だが、値段が高いお店',
      option_b: '値段は安いが、店員の対応が冷たいお店'
    },
    'space_hygiene': {
      option_a: 'プライベート感のある空間だが、店内が汚いお店',
      option_b: '店内はきれいだが、席同士が近くて騒がしいお店'
    },
    'space_price': {
      option_a: 'プライベート感のある空間だが、値段が高いお店',
      option_b: '値段は安いが、席同士が近くて騒がしいお店'
    },
    'hygiene_price': {
      option_a: '店内はきれいだが、値段が高いお店',
      option_b: '値段は安いが、店内が汚いお店'
    }
  };
  
  // パターンのキーを生成（順序を統一）
  const ids = [attr1, attr2].sort();
  const patternKey = `${ids[0]}_${ids[1]}`;
  
  const pattern = patterns[patternKey];
  if (!pattern) {
    // フォールバック: 動的に生成
    const [attrA, attrB] = randomizeOrder && Math.random() > 0.5 ? 
      [attribute2, attribute1] : [attribute1, attribute2];
    
    return {
      id: `comp_${attr1}_${attr2}`,
      option_a_text: `${attrA.positive}${attrA.positive_conjunction || 'だが、'}${attrB.negative}お店`,
      option_b_text: `${attrB.positive}${attrB.positive_conjunction || 'だが、'}${attrA.negative}お店`,
      attribute_a: attrA.id,
      attribute_b: attrB.id
    };
  }
  
  // A店とB店をランダムに割り当て（attr1が先の場合の属性を決定）
  let optionA, optionB, attrA, attrB;
  
  if (ids[0] === attr1) {
    // attr1が最初の属性
    optionA = pattern.option_a;
    optionB = pattern.option_b;
    attrA = attr1;
    attrB = attr2;
  } else {
    // attr2が最初の属性
    optionA = pattern.option_b;
    optionB = pattern.option_a;
    attrA = attr2;
    attrB = attr1;
  }
  
  // ランダムに入れ替え
  if (randomizeOrder && Math.random() > 0.5) {
    [optionA, optionB] = [optionB, optionA];
    [attrA, attrB] = [attrB, attrA];
  }
  
  return {
    id: `comp_${attr1}_${attr2}`,
    option_a_text: optionA,
    option_b_text: optionB,
    attribute_a: attrA,
    attribute_b: attrB
  };
}

/**
 * トーナメントの状態を管理するクラスをエクスポート
 */
export { TournamentState };