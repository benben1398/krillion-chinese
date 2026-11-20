const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════
// TIER DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const TIERS = [
  { name: "浮游",    points: 10,  emoji: "🦐", color: "#8bc34a" },
  { name: "聪明",    points: 15,  emoji: "🐠", color: "#cddc39" },
  { name: "鱼群",    points: 30,  emoji: "🐟", color: "#ffeb3b" },
  { name: "稀有",    points: 60,  emoji: "🐡", color: "#ff9800" },
  { name: "深海",    points: 85,  emoji: "🦑", color: "#f44336" },
  { name: "亿中选一", points: 100, emoji: "🐙", color: "#e040fb" },
];
const TIER_ORDER = ["浮游","聪明","鱼群","稀有","深海","亿中选一"];

// ═══════════════════════════════════════════════════════════════
// CASUAL & DAILY LIFE QUESTION DATABASE (Mandarin Chinese + common aliases)
// ═══════════════════════════════════════════════════════════════
const ALL_QUESTIONS = [
  {
    prompt: "说出一种常见的水果",
    hint: "甜甜多汁，日常解馋 🍎",
    answers: {
      "浮游":   ["苹果","香蕉","西瓜","草莓","葡萄","apple","banana"],
      "聪明":   ["橙子","桃子","芒果","梨","樱桃","柠檬","蓝莓","柚子","哈密瓜","桔子","橘子"],
      "鱼群":   ["猕猴桃","火龙果","荔枝","榴莲","石榴","木瓜","椰子","杏","李子","菠萝","凤梨","车厘子"],
      "稀有":   ["百香果","山竹","龙眼","杨梅","枇杷","桑葚","杨桃","无花果","牛油果","番石榴","鳄梨"],
      "深海":   ["莲雾","释迦果","蛇皮果","人参果","刺梨","黄皮","红毛丹","菠萝蜜","沙棘","覆盆子","黑莓"],
      "亿中选一":["嘉宝果","蛋黄果","神秘果","佛手柑","酸角","羊奶果","面包果","黑布林","醋栗","灯笼果","指橙","仙人掌果"]
    }
  },
  {
    prompt: "说出一种生活或自然界的动物",
    hint: "陆地、天空与水中的生物 🐾",
    answers: {
      "浮游":   ["猫","狗","鱼","兔子","鸟","老虎","狮子","大象","熊猫","猴子"],
      "聪明":   ["马","牛","羊","猪","鸡","鸭","蛇","鹰","狐狸","狼","鲨鱼","海豚","企鹅","鹿","熊"],
      "鱼群":   ["长颈鹿","河马","犀牛","北极熊","袋鼠","考拉","乌龟","蜥蜴","猫头鹰","仓鼠","松鼠","水獭","刺猬"],
      "稀有":   ["穿山甲","雪豹","蜜獾","树懒","鸭嘴兽","变色龙","海马","食蚁兽","羊驼","环尾狐猴","火烈鸟","浣熊"],
      "深海":   ["大王乌贼","鮟鱇鱼","儒艮","麝","紫貂","黑猩猩","倭黑猩猩","灵猫","獐子","鬣狗","狞猫","薮猫"],
      "亿中选一":["指猴","㺢㹢狓","针鼹","藏羚羊","白鱀豚","蓝足鲣鸟","鸮鹦鹉","非洲野犬","星鼻鼹鼠","角蝰","兔狲","雪貂"]
    }
  },
  {
    prompt: "说出一种日常蔬菜",
    hint: "健康餐盘必备 🥦",
    answers: {
      "浮游":   ["白菜","番茄","西红柿","黄瓜","土豆","胡萝卜","茄子","青椒","玉米"],
      "聪明":   ["西兰花","菠菜","豆角","芹菜","洋葱","蒜","生姜","南瓜","冬瓜","莴笋","韭菜","生菜"],
      "鱼群":   ["秋葵","藕","山药","苦瓜","丝瓜","荷兰豆","豌豆","毛豆","芦笋","西葫芦","紫甘蓝","菜花","花菜"],
      "稀有":   ["牛蒡","鱼腥草","折耳根","荸荠","茭白","蕨菜","穿心莲","豆苗","蛇瓜","佛手瓜","空心菜","茼蒿"],
      "深海":   ["朝鲜蓟","羽衣甘蓝","芥蓝","菊花脑","冰草","马兰头","苋菜","枸杞芽","费菜","红凤菜"],
      "亿中选一":["孢子甘蓝","球茎茴香","宝塔菜花","紫山药","冬寒菜","菜薹","芜菁","瓠子","黄花菜","罗勒叶","芝麻菜"]
    }
  },
  {
    prompt: "说出一个世界上的国家",
    hint: "全球近200个国家与地区 🌍",
    answers: {
      "浮游":   ["中国","美国","日本","韩国","英国","法国","俄罗斯","德国"],
      "聪明":   ["加拿大","澳大利亚","巴西","印度","意大利","西班牙","泰国","新加坡","越南","马来西亚"],
      "鱼群":   ["墨西哥","埃及","土耳其","瑞士","瑞典","荷兰","新西兰","阿根廷","南非","挪威","芬兰","希腊"],
      "稀有":   ["冰岛","葡萄牙","波兰","匈牙利","捷克","奥地利","智利","哥伦比亚","秘鲁","摩洛哥","尼泊尔","爱尔兰"],
      "深海":   ["斯洛文尼亚","克罗地亚","乌拉圭","巴拿马","斯里兰卡","约旦","黎巴嫩","阿曼","文莱","老挝","缅甸","蒙古","古巴"],
      "亿中选一":["莱索托","布隆迪","基里巴斯","瑙鲁","图瓦卢","帕劳","列支敦士登","安道尔","摩纳哥","圣马力诺","东帝汶","瓦努阿图"]
    }
  },
  {
    prompt: "说出一种运动或体育项目",
    hint: "强身健体、赛场竞技 ⚽",
    answers: {
      "浮游":   ["足球","篮球","游泳","跑步","乒乓球","羽毛球","排球"],
      "聪明":   ["网球","棒球","高尔夫","滑雪","体操","跳水","射击","举重","拳击","瑜伽","台球"],
      "鱼群":   ["橄榄球","冰球","板球","击剑","射箭","赛艇","帆船","马术","蹦床","攀岩","冲浪","滑板","保龄球"],
      "稀有":   ["壁球","曲棍球","铁人三项","跳台滑雪","花样滑冰","短道速滑","水球","手球","藤球","空手道","跆拳道"],
      "深海":   ["雪橇","冰壶","现代五项","小轮车","滑翔伞","沙壶球","回力球","卡巴迪","极限飞盘","皮划艇"],
      "亿中选一":["马球","地掷球","合气道","卡波耶拉","木球","定向越野","蹴鞠","水上马球","斯诺克","相扑"]
    }
  },
  {
    prompt: "说出一种日常饮料",
    hint: "逛街吃饭经常喝的 🥤",
    answers: {
      "浮游":   ["可乐","矿泉水","牛奶","橙汁","咖啡","茶","啤酒","豆浆","水"],
      "聪明":   ["雪碧","奶茶","果汁","酸奶","椰汁","红牛","冰红茶","柠檬茶","王老吉","美年达"],
      "鱼群":   ["气泡水","功夫茶","热巧克力","冰美式","拿铁","卡布奇诺","抹茶","芬达","百事可乐","燕麦奶","椰子水"],
      "稀有":   ["酸梅汤","绿豆沙","甘蔗汁","杨枝甘露","阿华田","美禄","北冰洋","健力宝","养乐多","康普茶"],
      "深海":   ["冬瓜茶","罗汉果茶","洛神花茶","桂花酿","米酒","醪糟","青稞酒","马黛茶","波子汽水","黑咖啡"],
      "亿中选一":["格瓦斯","崂山白花蛇草水","东方树叶","油柑汁","西番莲汁","木瓜牛奶","陈皮水","冷萃茶","气泡美式"]
    }
  },
  {
    prompt: "说出一个知名的汽车品牌",
    hint: "街头巷尾随处可见 🚗",
    answers: {
      "浮游":   ["丰田","本田","奔驰","宝马","奥迪","大众","特斯拉","比亚迪"],
      "聪明":   ["日产","现代","起亚","福特","雪佛兰","别克","沃尔沃","保时捷","路虎","吉利"],
      "鱼群":   ["马自达","斯巴鲁","雷克萨斯","凯迪拉克","捷豹","三菱","铃木","长城","蔚来","小鹏","理想"],
      "稀有":   ["玛莎拉蒂","兰博基尼","法拉利","迈凯伦","阿斯顿马丁","宾利","劳斯莱斯","极星","零跑","极氪"],
      "深海":   ["柯尼塞格","布加迪","帕加尼","莲花","迈巴赫","五菱","哈弗","欧拉","阿尔法罗密欧","菲亚特"],
      "亿中选一":["仰望","昊铂","极狐","飞凡","智己","方程豹","达契亚","双龙","宝腾","光冈","克莱斯勒"]
    }
  },
  {
    prompt: "说出一种音乐乐器",
    hint: "奏响悦耳动听的旋律 🎵",
    answers: {
      "浮游":   ["钢琴","吉他","小提琴","架子鼓","鼓","笛子"],
      "聪明":   ["大提琴","贝斯","萨克斯","长笛","单簧管","口琴","尤克里里","手风琴","二胡","古筝"],
      "鱼群":   ["竖琴","小号","长号","双簧管","电吉他","琵琶","唢呐","非洲鼓","扬琴","三角铁","木琴"],
      "稀有":   ["大号","短笛","巴松管","英国管","马林巴","古琴","箫","中提琴","低音提琴","曼陀林"],
      "深海":   ["钢片琴","管风琴","特雷门琴","排箫","埙","笙","阮","柳琴","三弦","定音鼓","手碟"],
      "亿中选一":["迪吉里杜管","恰朗戈","卡林巴","扎木聂","冬不拉","库木孜","弹布尔","热瓦普","尺八","风笛"]
    }
  },
  {
    prompt: "说出一种社会职业或工作",
    hint: "三百六十行，行行出状元 💼",
    answers: {
      "浮游":   ["老师","医生","警察","律师","工程师","程序员","厨师","护士","司机"],
      "聪明":   ["会计","设计师","记者","作家","导演","演员","歌手","画家","建筑师","翻译","飞行员","消防员"],
      "鱼群":   ["心理咨询师","营养师","药剂师","兽医","考古学家","天文学家","外交官","调酒师","花艺师","摄影师"],
      "稀有":   ["品酒师","速记员","气象预报员","验光师","精算师","催眠师","配音演员","文物修复师","空姐","空少"],
      "深海":   ["闻香师","侍酒师","游戏测试员","密室设计师","声优","宠物殡葬师","遗体化妆师","潜水员"],
      "亿中选一":["水下焊接工","太空农业研究员","恐龙化石修复师","高空擦窗工","脑机接口工程师","雪崩预测员","调香师"]
    }
  },
  {
    prompt: "说出一种美丽的花朵",
    hint: "花香满园，赏心悦目 🌸",
    answers: {
      "浮游":   ["玫瑰","向日葵","樱花","百合","菊花","郁金香","荷花","牡丹","康乃馨"],
      "聪明":   ["薰衣草","茉莉","兰花","桃花","梅花","紫罗兰","水仙","桂花","芍药","蒲公英","绣球花"],
      "鱼群":   ["木棉","杜鹃花","山茶花","鸢尾花","洋桔梗","满天星","勿忘我","雏菊","虞美人","铃兰","彼岸花"],
      "稀有":   ["石斛兰","蝴蝶兰","金银花","含笑","夜来香","仙客来","风信子","大丽花","三角梅","蜡梅","木槿"],
      "深海":   ["天堂鸟","帝王花","珙桐花","绿萼梅","曼珠沙华","曼陀罗","龙胆花","报春花","翠雀花","石蒜"],
      "亿中选一":["尸花","泰坦魔芋","玉凤花","雪莲","鬼兰","跳舞兰","绿玉藤","金花茶","水晶兰","大王花"]
    }
  },
  {
    prompt: "说出一种神奇的海洋生物",
    hint: "深蓝大海中的生灵 🐳",
    answers: {
      "浮游":   ["鲨鱼","鲸鱼","海豚","海龟","章鱼","水母","螃蟹","虾","海马"],
      "聪明":   ["海星","珊瑚","金枪鱼","三文鱼","龙虾","海参","鳐鱼","海胆","海狮","海象","海豹"],
      "鱼群":   ["电鳗","河豚","小丑鱼","蓝鲸","座头鲸","比目鱼","飞鱼","剑鱼","海蛇","鲍鱼","扇贝"],
      "稀有":   ["鹦鹉螺","翻车鱼","狮子鱼","石斑鱼","蝠鲼","蓝环章鱼","帝王蟹","椰子蟹","寄居蟹","墨鱼"],
      "深海":   ["鮟鱇鱼","吞噬鳗","大王具足虫","玻璃海鞘","冰海小精灵","太阳花海星","海百合","海蜘蛛","抹香鲸"],
      "亿中选一":["桶水母","深海龙鱼","尖牙鱼","巨型管水母","海猪","大西洋海神海蛞蝓","叶海龙","幽灵鲨","水滴鱼"]
    }
  },
  {
    prompt: "说出一个中外节日或特殊日子",
    hint: "放假、聚会、吃美食的好日子 🎉",
    answers: {
      "浮游":   ["春节","圣诞节","中秋节","情人节","国庆节","元旦","端午节","万圣节"],
      "聪明":   ["母亲节","父亲节","教师节","儿童节","劳动节","元宵节","感恩节","复活节","七夕"],
      "鱼群":   ["清明节","重阳节","光棍节","双十一","愚人节","妇女节","植树节","地球日","除夕"],
      "稀有":   ["泼水节","排灯节","开斋节","宰牲节","腊八节","寒食节","龙抬头","圣帕特里克节"],
      "深海":   ["冬至","下元节","国际和平日","世界读书日","世界无烟日","世界粮食日","国际友谊日"],
      "亿中选一":["火把节","花朝节","那达慕","三月三","国际左撇子日","世界厕所日","世界睡眠日","国际猫咪日"]
    }
  },
  {
    prompt: "说出一种出行的交通工具",
    hint: "带你走遍天涯海角 🚌",
    answers: {
      "浮游":   ["汽车","公交车","地铁","自行车","飞机","火车","出租车","高铁"],
      "聪明":   ["摩托车","船","电动车","轮船","游艇","直升机","三轮车","滑板车","网约车"],
      "鱼群":   ["拖拉机","缆车","热气球","帆船","独木舟","皮划艇","磁悬浮","有轨电车","渡轮"],
      "稀有":   ["雪橇","马车","骆驼","人力车","水上飞机","气垫船","悬挂式滑翔翼"],
      "深海":   ["竹筏","狗拉雪橇","单轨列车","胶囊列车","太阳能车","翼装飞行","游轮"],
      "亿中选一":["飞行汽车","赛格威","平衡车","独轮车","水上摩托","冰帆","太空飞船","马车夫车"]
    }
  },
  {
    prompt: "说出一种好吃的甜点或小吃",
    hint: "糖分带来的快乐 🍰",
    answers: {
      "浮游":   ["蛋糕","冰淇淋","巧克力","饼干","布丁","果冻","奶茶","泡芙"],
      "聪明":   ["提拉米苏","芝士蛋糕","马卡龙","曲奇","甜甜圈","华夫饼","可丽饼","慕斯","舒芙蕾"],
      "鱼群":   ["汤圆","月饼","糯米糍","千层蛋糕","蛋挞","双皮奶","杨枝甘露","烧仙草","绿豆糕","红豆沙"],
      "稀有":   ["抹茶卷","焦糖布丁","拿破仑","闪电泡芙","黑森林蛋糕","歌剧院蛋糕","瑞士卷","牛轧糖","驴打滚"],
      "深海":   ["巴斯克蛋糕","意式奶冻","法式千层酥","和果子","羊羹","铜锣烧","萨赫蛋糕","荷花酥"],
      "亿中选一":["帕芙洛娃","库纳法","巴拉瓦饼","定胜糕","龙须糖","姜撞奶","三不沾","雪衣豆沙"]
    }
  },
  {
    prompt: "说出一个家喻户晓的动漫或卡通角色",
    hint: "荧幕上的经典形象 📺",
    answers: {
      "浮游":   ["米老鼠","喜羊羊","哆啦A梦","孙悟空","海绵宝宝","小猪佩奇","蜡笔小新","柯南"],
      "聪明":   ["路飞","鸣人","灰太狼","蝙蝠侠","超人","蜘蛛侠","哪吒","艾莎","龙猫","皮卡丘"],
      "鱼群":   ["汤姆猫","杰瑞","唐老鸭","熊大","熊二","光头强","奥特曼","加菲猫","史努比","小黄人"],
      "稀有":   ["阿童木","樱桃小丸子","一拳超人","黑猫警长","舒克","贝塔","葫芦娃","大力水手","粉红豹"],
      "深海":   ["犬夜叉","银魂","夏目","金田一","迪迦","阿凡提","乱马","阿拉蕾","飞天小女警"],
      "亿中选一":["邋遢大王","没头脑和不高兴","海尔兄弟","魔方大厦","鸭子侦探","聪明的一休","雪孩子","舒克和贝塔"]
    }
  },
  {
    prompt: "说出一种大家喜欢的犬种",
    hint: "汪星人朋友 🐕",
    answers: {
      "浮游":   ["金毛","拉布拉多","哈士奇","泰迪","柯基","德牧","贵宾犬"],
      "聪明":   ["柴犬","边牧","萨摩耶","阿拉斯加","博美","法斗","英斗","比熊","吉娃娃","雪纳瑞"],
      "鱼群":   ["秋田犬","杜宾","罗威纳","大丹犬","圣伯纳","比格犬","巴哥犬","马尔济斯","约克夏","蝴蝶犬"],
      "稀有":   ["松狮","沙皮犬","斑点狗","灵缇","阿富汗猎犬","巴吉度","西施犬","可卡犬","牛头梗"],
      "深海":   ["中华田园犬","藏獒","下司犬","昆明犬","贝灵顿梗","苏俄猎狼犬","波利犬","卡斯罗"],
      "亿中选一":["科蒙多犬","加泰霍拉豹犬","泰国脊背犬","秘鲁无毛犬","罗得西亚背脊犬","爱尔兰雪达犬"]
    }
  },
  {
    prompt: "说出一种衣服或日常配饰",
    hint: "衣橱里的时尚单品 👔",
    answers: {
      "浮游":   ["T恤","裤子","裙子","鞋子","外套","帽子","袜子","衬衫"],
      "聪明":   ["牛仔裤","卫衣","羽绒服","运动鞋","围巾","手套","墨镜","手表","项链","耳环","背包","西装"],
      "鱼群":   ["风衣","大衣","短裤","凉鞋","拖鞋","高跟鞋","领带","腰带","手镯","胸针","渔夫帽","帆布鞋"],
      "稀有":   ["马甲","吊带","披肩","斗篷","贝雷帽","礼帽","袖扣","领带夹","脚链","发箍","棒球帽"],
      "深海":   ["方巾","口袋巾","发带","吊袜带","绑腿","面纱","头巾","耳罩","连体裤","雪地靴"],
      "亿中选一":["单片眼镜","袖箍","衬衫领撑","靴刺","袜圈","衣领花","手笼","护腕","马裤","打底裤"]
    }
  },
  {
    prompt: "说出一个手机或数码科技品牌",
    hint: "口袋里、书桌上的电子产品 📱",
    answers: {
      "浮游":   ["苹果","三星","华为","小米","apple","samsung","xiaomi","huawei"],
      "聪明":   ["OPPO","vivo","索尼","联想","戴尔","惠普","LG","诺基亚","sony","lenovo"],
      "鱼群":   ["一加","荣耀","真我","谷歌","微软","东芝","松下","佳能","尼康","飞利浦","asus","华硕"],
      "稀有":   ["魅族","中兴","努比亚","黑鲨","ROG","雷蛇","微星","宏碁","大疆","dji","bose"],
      "深海":   ["Nothing","传音","TCL","夏普","HTC","黑莓","摩托罗拉","森海塞尔","罗技","索爱"],
      "亿中选一":["8848","美图","锤子","坚果","金立","多亲","漫步者","飞傲","山灵","艾利和"]
    }
  },
  {
    prompt: "说出一种厨房常用的调味品",
    hint: "炒菜烹饪必不可少 🧂",
    answers: {
      "浮游":   ["盐","糖","酱油","醋","辣椒","胡椒","味精"],
      "聪明":   ["蒜","姜","葱","花椒","八角","桂皮","蚝油","番茄酱","芥末","料酒","鸡精","芝麻油","香油"],
      "鱼群":   ["五香粉","十三香","豆瓣酱","甜面酱","芝麻酱","沙拉酱","黄油","橄榄油","蜂蜜","黑胡椒"],
      "稀有":   ["罗勒","百里香","牛至","丁香","小茴香","肉豆蔻","莳萝","迷迭香","柠檬汁","孜然","咖喱"],
      "深海":   ["鱼露","虾酱","味增","照烧酱","塔巴斯科","松露油","薄荷叶","香茅","苹果醋"],
      "亿中选一":["沙姜粉","良姜","草果","荜拨","山柰","砂仁","番红花","甘草粉","木姜子油"]
    }
  },
  {
    prompt: "说出一种香脆的坚果或种子零食",
    hint: "追剧聊天必备零食 🥜",
    answers: {
      "浮游":   ["花生","瓜子","核桃","杏仁","腰果","开心果","栗子","葡萄干"],
      "聪明":   ["夏威夷果","碧根果","松子","榛子","蔓越莓干","芒果干","红枣","枸杞"],
      "鱼群":   ["巴旦木","白果","莲子","南瓜子","西瓜子","无花果干","桂圆干","山楂干","椰子片"],
      "稀有":   ["鲍鱼果","澳洲坚果","霹雳果","香榧","橡子","奇亚籽","亚麻籽","葵花籽"],
      "深海":   ["沙漠果","枣椰子","油棕果","铁核桃","腰果仁","白芝麻","黑芝麻"],
      "亿中选一":["虎坚果","文冠果","松塔子","翅果油树果","沙棘干","雪莲果干"]
    }
  },
  {
    prompt: "说出一种常见的主食或面食",
    hint: "顿顿少不了的能量来源 🍜",
    answers: {
      "浮游":   ["米饭","面条","饺子","馒头","包子","炒饭","方便面","拉面"],
      "聪明":   ["意大利面","馄饨","粽子","煎饼","披萨","汉堡","三明治","寿司","烧饼","手抓饼"],
      "鱼群":   ["刀削面","担担面","热干面","凉皮","肉夹馍","煎饺","锅贴","小笼包","生煎","油条"],
      "稀有":   ["螺蛳粉","肠粉","河粉","粿条","年糕","糍粑","青团","花卷","荞麦面","乌冬面"],
      "深海":   ["猫耳朵","疙瘩汤","饸饹面","擀面皮","冷面","米线","烤馕","窝窝头","发糕"],
      "亿中选一":["biangbiang面","羊肉泡馍","甜水面","铜锅焖面","糌粑","莜面鱼鱼","浆水面","油泼扯面"]
    }
  },
  {
    prompt: "说出一种好玩的桌游或棋牌",
    hint: "聚会团建时大家一起玩的 ♟️",
    answers: {
      "浮游":   ["象棋","围棋","五子棋","国际象棋","跳棋","麻将","斗地主","UNO","扑克牌"],
      "聪明":   ["飞行棋","军棋","大富翁","三国杀","狼人杀","黑白棋","数独"],
      "鱼群":   ["卡坦岛","剧本杀","谁是卧底","德州扑克","桥牌","拼图","多米诺骨牌","德国心脏病"],
      "稀有":   ["璀璨宝石","车票之旅","卡卡颂","七大奇迹","瘟疫危机","阿瓦隆","炸弹猫"],
      "深海":   ["幽港迷城","殖民火星","万智牌","龙与地下城","冷战热斗","历史巨轮","农场主"],
      "亿中选一":["盖亚计划","大西部之路","勃艮第城堡","神秘大地","以星之名","奥尔良","诡镇奇谈"]
    }
  },
  {
    prompt: "说出一种广受欢迎的电影类型",
    hint: "周末影院大片 🎬",
    answers: {
      "浮游":   ["喜剧片","喜剧","动作片","动作","爱情片","爱情","恐怖片","恐怖","科幻片","科幻","动画片","动画"],
      "聪明":   ["悬疑片","惊悚片","战争片","犯罪片","冒险片","灾难片","奇幻片","武侠片","纪录片"],
      "鱼群":   ["传记片","歌舞片","西部片","公路片","青春片","体育片","谍战片","历史片"],
      "稀有":   ["黑色电影","超级英雄片","丧尸片","怪兽片","太空歌剧","赛博朋克","武打片"],
      "深海":   ["邪典片","实验电影","默片","伪纪录片","B级片","新浪潮","超现实主义电影"],
      "亿中选一":["散文电影","慢电影","城市交响曲","桌面电影","先锋电影","蒙太奇电影"]
    }
  },
  {
    prompt: "说出一种清凉美味的冰淇淋口味",
    hint: "炎炎夏日的最爱 🍦",
    answers: {
      "浮游":   ["香草","巧克力","草莓","芒果","抹茶"],
      "聪明":   ["牛奶","奶油","蓝莓","柠檬","椰子","红豆","绿茶","曲奇","香芋"],
      "鱼群":   ["薄荷巧克力","焦糖","咖啡","花生","榛子","开心果","百香果","荔枝","酸奶","提拉米苏"],
      "稀有":   ["黑芝麻","玫瑰","桂花","薰衣草","朗姆葡萄干","太妃糖","海盐","黄桃"],
      "深海":   ["海盐焦糖","柚子","无花果","肉桂","番薯","南瓜","芝士","黄油啤酒"],
      "亿中选一":["黑蒜","辣椒巧克力","花椒","芥末","松露","香菜","老干妈","咸蛋黄"]
    }
  },
  {
    prompt: "说出一个手机里常用的App",
    hint: "每天屏幕使用时间最长的地方 📲",
    answers: {
      "浮游":   ["微信","抖音","淘宝","支付宝","QQ","微博","哔哩哔哩","B站","wechat","tiktok"],
      "聪明":   ["小红书","美团","拼多多","京东","百度","网易云音乐","快手","知乎","闲鱼","饿了么","滴滴"],
      "鱼群":   ["高德地图","百度地图","携程","大众点评","腾讯视频","爱奇艺","优酷","喜马拉雅","钉钉","飞书"],
      "稀有":   ["得物","豆瓣","即刻","货拉拉","boss直聘","Notion","剪映","夸克","夸克浏览器"],
      "深海":   ["小宇宙","Forest","潮汐","Snapseed","彩云天气","Flomo","多邻国","Duolingo"],
      "亿中选一":["Obsidian","Logseq","Heptabase","Day One","Via浏览器","李跳跳","Raindrop"]
    }
  },
  {
    prompt: "说出一种动听的音乐风格",
    hint: "耳机里播放的旋律 🎶",
    answers: {
      "浮游":   ["流行","摇滚","嘻哈","说唱","古典","电子","民谣","R&B","pop","rock"],
      "聪明":   ["爵士","布鲁斯","乡村音乐","金属","朋克","雷鬼","放克","迪斯科","jazz"],
      "鱼群":   ["EDM","独立音乐","另类摇滚","后摇","新金属","Trap","House","Techno","Lo-fi","Bossa Nova"],
      "稀有":   ["前卫摇滚","迷幻摇滚","合成器流行","City Pop","Dream Pop","Ambient","氛围音乐"],
      "深海":   ["数学摇滚","后朋克","黑金属","厄运金属","Vaporwave","蒸汽波","Hyperpop","Drum and Bass"],
      "亿中选一":["自由爵士","微声音乐","田野录音","Krautrock","Zeuhl","Canterbury"]
    }
  },
  {
    prompt: "说出一处世界上著名的地标或景点",
    hint: "旅行打卡胜地 🗼",
    answers: {
      "浮游":   ["长城","埃菲尔铁塔","自由女神像","金字塔","泰姬陵","东京塔"],
      "聪明":   ["大本钟","悉尼歌剧院","比萨斜塔","故宫","凯旋门","富士山","凡尔赛宫","罗马斗兽场"],
      "鱼群":   ["圣家堂","科隆大教堂","帕特农神庙","吴哥窟","马丘比丘","红场","尼亚加拉瀑布","黄石公园"],
      "稀有":   ["哈利法塔","佩特拉古城","圣索菲亚大教堂","蓝色清真寺","拉什莫尔山","布达佩斯国会大厦"],
      "深海":   ["布达拉宫","伏见稻荷大社","棉花堡","蓝湖","张家界天门山","新天鹅堡"],
      "亿中选一":["奇琴伊察","提卡尔","博罗布杜尔","瓦迪拉姆","虎穴寺","蒲甘佛塔群"]
    }
  },
  {
    prompt: "说出一种风靡的电子游戏",
    hint: "电脑、主机或手机上畅玩 🎮",
    answers: {
      "浮游":   ["王者荣耀","原神","英雄联盟","LOL","和平精英","我的世界","Minecraft","吃鸡"],
      "聪明":   ["CSGO","绝地求生","GTA5","塞尔达传说","超级马里奥","宝可梦","APEX","无畏契约","Valorant"],
      "鱼群":   ["艾尔登法环","黑神话悟空","暗黑破坏神","荒野大镖客","巫师3","星露谷物语","泰拉瑞亚","生化危机"],
      "稀有":   ["空洞骑士","死亡搁浅","只狼","怪物猎人","辐射","赛博朋克2077","双人成行","哈迪斯"],
      "深海":   ["星际争霸","魔兽争霸","文明6","博德之门3","女神异闻录5","极乐迪斯科","蔚蓝"],
      "亿中选一":["艾迪芬奇的记忆","极品飞车","天国拯救","奥日与黑暗森林","传说之下","雨中冒险2"]
    }
  },
  {
    prompt: "说出一种家中常用的家用电器",
    hint: "带来便利生活的电器 🔌",
    answers: {
      "浮游":   ["冰箱","电视","洗衣机","空调","微波炉","电风扇"],
      "聪明":   ["电饭煲","电热水壶","吸尘器","吹风机","烤箱","空气炸锅","饮水机"],
      "鱼群":   ["洗碗机","扫地机器人","加湿器","除湿机","净水器","电磁炉","破壁机","豆浆机"],
      "稀有":   ["咖啡机","挂烫机","消毒柜","厨余垃圾处理器","烘干机","空气净化器","暖风机"],
      "深海":   ["制冰机","厨师机","蒸烤箱","恒温杯垫","除螨仪","足浴盆","智能马桶盖"],
      "亿中选一":["红酒柜","超声波清洗机","鞋子烘干器","真空封口机","酸奶机","面条机"]
    }
  },
  {
    prompt: "说出一个大学常见专业或学术学科",
    hint: "大学课表上的方向 🎓",
    answers: {
      "浮游":   ["计算机","数学","英语","经济学","法学","医学","物理"],
      "聪明":   ["金融学","会计学","化学","生物学","历史学","哲学","心理学","汉语言文学","土木工程"],
      "鱼群":   ["机械工程","电气工程","社会学","政治学","新闻学","统计学","建筑学","环境科学","药学"],
      "稀有":   ["考古学","天文学","地质学","人类学","海洋科学","哲学","逻辑学","国际关系"],
      "深海":   ["生物信息学","古生物学","核工程","宗教学","草业科学","蚕学","茶学"],
      "亿中选一":["飞行器设计","核聚变工程","密码学","古文字学","计算语言学","假肢矫形工程"]
    }
  }
];

// Emojis for players
const PLAYER_EMOJIS = ["🐟","🐠","🐡","🦑","🐙","🦐","🐳","🐋","🦈","🐬","🐢","🦀","🦞","🦭","🐧","🦦"];

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY ROOM STORAGE
// ═══════════════════════════════════════════════════════════════
const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswer(str) {
  if (!str) return '';
  return str.toString().toLowerCase().replace(/\s+/g, '').replace(/[.,，。、！!？?·~]/g, '');
}

function matchAnswer(input, answers) {
  const norm = normalizeAnswer(input);
  if (!norm) return null;
  // Check from rarest tier to common tier
  for (const tierName of [...TIER_ORDER].reverse()) {
    const list = answers[tierName] || [];
    for (const a of list) {
      if (normalizeAnswer(a) === norm) return tierName;
    }
  }
  return null;
}

function getPlayersArray(room) {
  return Array.from(room.players.values()).map(p => ({
    id: p.id,
    nickname: p.nickname,
    emoji: p.emoji,
    score: p.score,
    depth: p.score * 10,
    isHost: p.id === room.hostId,
    answered: p.currentAnswer !== null,
  }));
}

function getRoomState(room) {
  return {
    code: room.code,
    state: room.state,
    hostId: room.hostId,
    players: getPlayersArray(room),
    settings: room.settings,
    currentRound: room.currentRound,
    totalRounds: room.questions.length,
  };
}

// Broadcast SSE event to all connected clients in a room
function broadcast(room, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const p of room.players.values()) {
    if (p.sseRes && !p.sseRes.writableEnded) {
      try {
        p.sseRes.write(payload);
      } catch (e) {
        // connection closed
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// GAME FLOW HELPERS
// ═══════════════════════════════════════════════════════════════
function startRound(room) {
  const q = room.questions[room.currentRound];
  for (const p of room.players.values()) {
    p.currentAnswer = null;
  }

  broadcast(room, 'round-start', {
    roundNum: room.currentRound + 1,
    totalRounds: room.questions.length,
    prompt: q.prompt,
    hint: q.hint,
    duration: room.settings.timePerRound,
  });

  if (room.roundTimer) clearTimeout(room.roundTimer);
  room.roundTimer = setTimeout(() => {
    endRound(room);
  }, room.settings.timePerRound * 1000);
}

function checkRoundComplete(room) {
  if (room.state !== 'playing') return;
  const allAnswered = [...room.players.values()].every(p => p.currentAnswer !== null);
  if (allAnswered) {
    if (room.roundTimer) clearTimeout(room.roundTimer);
    setTimeout(() => endRound(room), 600);
  }
}

function endRound(room) {
  if (room.state !== 'playing') return;
  room.state = 'round-results';
  if (room.roundTimer) clearTimeout(room.roundTimer);

  const q = room.questions[room.currentRound];
  const results = [];

  for (const p of room.players.values()) {
    if (p.currentAnswer) {
      results.push({
        playerId: p.id,
        nickname: p.nickname,
        emoji: p.emoji,
        answer: p.currentAnswer.answer,
        tier: p.currentAnswer.tier,
        points: p.currentAnswer.points,
        totalScore: p.score,
        depth: p.score * 10,
      });
    } else {
      results.push({
        playerId: p.id,
        nickname: p.nickname,
        emoji: p.emoji,
        answer: '—',
        tier: null,
        points: 0,
        totalScore: p.score,
        depth: p.score * 10,
      });
    }
  }

  results.sort((a, b) => b.points - a.points);
  room.roundHistory.push({ prompt: q.prompt, results });

  broadcast(room, 'round-end', {
    roundNum: room.currentRound + 1,
    totalRounds: room.questions.length,
    prompt: q.prompt,
    results,
    nextIn: 6,
  });

  // Advance after 6 seconds
  room.roundTimer = setTimeout(() => {
    room.currentRound++;
    if (room.currentRound >= room.questions.length) {
      gameOver(room);
    } else {
      room.state = 'playing';
      startRound(room);
    }
  }, 6000);
}

function gameOver(room) {
  room.state = 'game-over';
  if (room.roundTimer) clearTimeout(room.roundTimer);

  const leaderboard = [];
  for (const p of room.players.values()) {
    leaderboard.push({
      playerId: p.id,
      nickname: p.nickname,
      emoji: p.emoji,
      totalScore: p.score,
      depth: p.score * 10,
    });
  }
  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  broadcast(room, 'game-over', {
    leaderboard,
    roundHistory: room.roundHistory,
  });
}

function removePlayer(room, playerId) {
  room.players.delete(playerId);
  if (room.players.size === 0) {
    if (room.roundTimer) clearTimeout(room.roundTimer);
    rooms.delete(room.code);
    return;
  }
  if (room.hostId === playerId) {
    const nextHost = room.players.keys().next().value;
    room.hostId = nextHost;
    broadcast(room, 'host-changed', { hostId: room.hostId });
  }
  broadcast(room, 'player-list-updated', { players: getPlayersArray(room) });
  if (room.state === 'playing') {
    checkRoundComplete(room);
  }
}

// ═══════════════════════════════════════════════════════════════
// HTTP ROUTER & REQUEST HANDLER
// ═══════════════════════════════════════════════════════════════
function readJson(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

function serveStatic(res, filePath, contentType) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // CORS headers
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  // ── SSE STREAM ──
  if (pathname === '/api/events' && req.method === 'GET') {
    const code = (url.searchParams.get('code') || '').toUpperCase().trim();
    const playerId = url.searchParams.get('playerId');

    const room = rooms.get(code);
    if (!room || !room.players.has(playerId)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Room or player not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    const player = room.players.get(playerId);
    player.sseRes = res;

    // Send initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ roomState: getRoomState(room) })}\n\n`);

    // Keepalive ping every 15s
    const pingInterval = setInterval(() => {
      if (!res.writableEnded) {
        res.write(': ping\n\n');
      }
    }, 15000);

    req.on('close', () => {
      clearInterval(pingInterval);
      if (player.sseRes === res) {
        player.sseRes = null;
      }
    });
    return;
  }

  // ── CREATE ROOM ──
  if (pathname === '/api/create-room' && req.method === 'POST') {
    const body = await readJson(req);
    let nickname = (body.nickname || '').trim().slice(0, 12);
    if (!nickname) {
      return sendJson(res, 400, { error: '请输入昵称' });
    }

    const code = generateCode();
    const playerId = 'p_' + crypto.randomBytes(6).toString('hex');
    const player = {
      id: playerId,
      nickname,
      emoji: PLAYER_EMOJIS[0],
      score: 0,
      currentAnswer: null,
      sseRes: null,
    };

    const room = {
      code,
      hostId: playerId,
      players: new Map([[playerId, player]]),
      emojiIndex: 1,
      settings: { numQuestions: 7, timePerRound: 25 },
      state: 'lobby',
      questions: [],
      currentRound: 0,
      roundTimer: null,
      roundHistory: [],
    };

    rooms.set(code, room);
    return sendJson(res, 200, {
      code,
      playerId,
      player: { id: player.id, nickname: player.nickname, emoji: player.emoji },
      roomState: getRoomState(room),
    });
  }

  // ── JOIN ROOM ──
  if (pathname === '/api/join-room' && req.method === 'POST') {
    const body = await readJson(req);
    let nickname = (body.nickname || '').trim().slice(0, 12);
    const code = (body.code || '').toUpperCase().trim();

    if (!nickname) return sendJson(res, 400, { error: '请输入昵称' });
    if (!code) return sendJson(res, 400, { error: '请输入房间邀请码' });

    const room = rooms.get(code);
    if (!room) return sendJson(res, 404, { error: '房间不存在，请检查邀请码' });
    if (room.state !== 'lobby') return sendJson(res, 400, { error: '游戏已经开始，无法加入' });
    if (room.players.size >= 10) return sendJson(res, 400, { error: '房间已满（最多10人）' });

    for (const p of room.players.values()) {
      if (p.nickname === nickname) {
        return sendJson(res, 400, { error: '昵称已被使用，请换一个' });
      }
    }

    const playerId = 'p_' + crypto.randomBytes(6).toString('hex');
    const emoji = PLAYER_EMOJIS[room.emojiIndex % PLAYER_EMOJIS.length];
    room.emojiIndex++;

    const player = {
      id: playerId,
      nickname,
      emoji,
      score: 0,
      currentAnswer: null,
      sseRes: null,
    };

    room.players.set(playerId, player);

    // Broadcast new player joined
    broadcast(room, 'player-list-updated', { players: getPlayersArray(room) });

    return sendJson(res, 200, {
      code,
      playerId,
      player: { id: player.id, nickname: player.nickname, emoji: player.emoji },
      roomState: getRoomState(room),
    });
  }

  // ── UPDATE SETTINGS (Host only) ──
  if (pathname === '/api/update-settings' && req.method === 'POST') {
    const body = await readJson(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const room = rooms.get(code);

    if (!room || room.hostId !== playerId) {
      return sendJson(res, 403, { error: '无权限修改设置' });
    }
    if (room.state !== 'lobby') {
      return sendJson(res, 400, { error: '游戏进行中无法修改设置' });
    }

    if (body.numQuestions) {
      room.settings.numQuestions = Math.max(3, Math.min(15, parseInt(body.numQuestions) || 7));
    }
    if (body.timePerRound) {
      room.settings.timePerRound = Math.max(10, Math.min(60, parseInt(body.timePerRound) || 25));
    }

    broadcast(room, 'settings-updated', { settings: room.settings });
    return sendJson(res, 200, { success: true, settings: room.settings });
  }

  // ── START GAME (Host only) ──
  if (pathname === '/api/start-game' && req.method === 'POST') {
    const body = await readJson(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const room = rooms.get(code);

    if (!room || room.hostId !== playerId) {
      return sendJson(res, 403, { error: '只有房主可以开始游戏' });
    }
    if (room.state !== 'lobby') {
      return sendJson(res, 400, { error: '游戏已经开始' });
    }

    room.state = 'playing';
    room.questions = shuffle(ALL_QUESTIONS).slice(0, Math.min(room.settings.numQuestions, ALL_QUESTIONS.length));
    room.currentRound = 0;
    room.roundHistory = [];

    for (const p of room.players.values()) {
      p.score = 0;
      p.currentAnswer = null;
    }

    broadcast(room, 'game-started', {});
    startRound(room);

    return sendJson(res, 200, { success: true });
  }

  // ── SUBMIT ANSWER ──
  if (pathname === '/api/submit-answer' && req.method === 'POST') {
    const body = await readJson(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const answer = (body.answer || '').trim();

    const room = rooms.get(code);
    if (!room || room.state !== 'playing') {
      return sendJson(res, 400, { error: '当前不在答题时间' });
    }

    const player = room.players.get(playerId);
    if (!player) return sendJson(res, 404, { error: '玩家未找到' });
    if (player.currentAnswer) {
      return sendJson(res, 400, { error: '你本轮已经提交过答案了' });
    }

    const q = room.questions[room.currentRound];
    const tierName = matchAnswer(answer, q.answers);

    if (!tierName) {
      return sendJson(res, 200, {
        accepted: false,
        message: '❌ 不符合条件或未被收录，换个更精准的试试！',
      });
    }

    const tierObj = TIERS.find(t => t.name === tierName);
    const points = tierObj ? tierObj.points : 0;
    player.currentAnswer = { answer, tier: tierName, points };
    player.score += points;

    // Broadcast that this player answered (without revealing the answer yet!)
    broadcast(room, 'player-answered', {
      playerId,
      nickname: player.nickname,
      emoji: player.emoji,
      answeredCount: [...room.players.values()].filter(p => p.currentAnswer !== null).length,
      totalPlayers: room.players.size,
    });

    // Check if everyone has submitted
    checkRoundComplete(room);

    return sendJson(res, 200, {
      accepted: true,
      answer,
      tier: tierName,
      tierEmoji: tierObj.emoji,
      tierColor: tierObj.color,
      points,
      depthSunk: points * 10,
      totalScore: player.score,
      totalDepth: player.score * 10,
    });
  }

  // ── LEAVE ROOM ──
  if (pathname === '/api/leave-room' && req.method === 'POST') {
    const body = await readJson(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const room = rooms.get(code);
    if (room && room.players.has(playerId)) {
      removePlayer(room, playerId);
    }
    return sendJson(res, 200, { success: true });
  }

  // ── PLAY AGAIN (Host only) ──
  if (pathname === '/api/play-again' && req.method === 'POST') {
    const body = await readJson(req);
    const code = (body.code || '').toUpperCase().trim();
    const playerId = body.playerId;
    const room = rooms.get(code);

    if (!room || room.hostId !== playerId) {
      return sendJson(res, 403, { error: '只有房主可以发起重新开始' });
    }

    room.state = 'lobby';
    room.questions = [];
    room.currentRound = 0;
    room.roundHistory = [];
    for (const p of room.players.values()) {
      p.score = 0;
      p.currentAnswer = null;
    }

    broadcast(room, 'back-to-lobby', { roomState: getRoomState(room) });
    return sendJson(res, 200, { success: true });
  }

  
// ═══════════════════════════════════════════════════════════════
// BULLETPROOF STATIC FILE SERVING
// ═══════════════════════════════════════════════════════════════
const EMBEDDED_MULTIPLAYER_HTML = "<!DOCTYPE html>\n<html lang=\"zh-CN\">\n<head>\n<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n<title>亿中选一 — 多人知识深潜游戏 (Krillion)</title>\n<style>\n@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap');\n\n:root {\n  --bg-deep: #030c1b;\n  --bg-surface: #0a1f3d;\n  --bg-card: rgba(14, 38, 74, 0.72);\n  --bg-card-hover: rgba(20, 52, 98, 0.85);\n  --border-glass: rgba(255, 255, 255, 0.12);\n  --border-glow: rgba(0, 229, 255, 0.4);\n  \n  --accent-cyan: #00e5ff;\n  --accent-blue: #0091ff;\n  --accent-gold: #ffd166;\n  --accent-coral: #ff6b6b;\n  \n  --tier-plankton: #8bc34a;\n  --tier-clever: #cddc39;\n  --tier-schooler: #ffeb3b;\n  --tier-rare: #ff9800;\n  --tier-deep: #f44336;\n  --tier-krillion: #e040fb;\n\n  --text-main: #f0f6fc;\n  --text-muted: #8ca2bf;\n  --text-dim: #546e8f;\n\n  --radius-sm: 8px;\n  --radius-md: 14px;\n  --radius-lg: 20px;\n  --radius-full: 9999px;\n\n  --shadow-card: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 229, 255, 0.08);\n  --shadow-glow: 0 0 24px rgba(0, 229, 255, 0.45);\n}\n\n* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n  -webkit-tap-highlight-color: transparent;\n}\n\nbody {\n  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;\n  background-color: var(--bg-deep);\n  background-image: radial-gradient(circle at 50% 0%, #0d325e 0%, #030c1b 75%);\n  color: var(--text-main);\n  min-height: 100vh;\n  overflow-x: hidden;\n  line-height: 1.5;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* BUBBLES BACKGROUND ANIMATION                    */\n/* ═══════════════════════════════════════════════ */\n.bubbles {\n  position: fixed;\n  inset: 0;\n  pointer-events: none;\n  z-index: 0;\n  overflow: hidden;\n}\n\n.bubble {\n  position: absolute;\n  bottom: -40px;\n  border-radius: 50%;\n  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), rgba(0, 229, 255, 0.08) 60%, rgba(255, 255, 255, 0) 70%);\n  border: 1px solid rgba(255, 255, 255, 0.18);\n  animation: floatUp linear infinite;\n}\n\n@keyframes floatUp {\n  0% {\n    transform: translateY(0) scale(1) translateX(0);\n    opacity: 0.6;\n  }\n  50% {\n    transform: translateY(-50vh) scale(1.1) translateX(15px);\n    opacity: 0.8;\n  }\n  100% {\n    transform: translateY(-110vh) scale(0.9) translateX(-15px);\n    opacity: 0;\n  }\n}\n\n/* ═══════════════════════════════════════════════ */\n/* APP LAYOUT & HEADER                             */\n/* ═══════════════════════════════════════════════ */\n.app-container {\n  position: relative;\n  z-index: 1;\n  max-width: 900px;\n  margin: 0 auto;\n  padding: 16px 20px 48px;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n}\n\n.game-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 12px 0 20px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n  margin-bottom: 24px;\n}\n\n.logo-area {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  cursor: pointer;\n}\n\n.logo-emoji {\n  font-size: 2.2rem;\n  filter: drop-shadow(0 0 12px var(--accent-cyan));\n  animation: gentleBob 3s ease-in-out infinite;\n}\n\n@keyframes gentleBob {\n  0%, 100% { transform: translateY(0); }\n  50% { transform: translateY(-4px); }\n}\n\n.logo-text h1 {\n  font-size: 1.6rem;\n  font-weight: 900;\n  letter-spacing: 1.5px;\n  background: linear-gradient(135deg, #ffffff 10%, var(--accent-cyan) 60%, var(--accent-gold) 100%);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}\n\n.logo-sub {\n  font-size: 0.8rem;\n  color: var(--text-muted);\n  font-weight: 400;\n  display: block;\n}\n\n.header-actions {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n}\n\n.player-badge {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid var(--border-glass);\n  padding: 6px 14px;\n  border-radius: var(--radius-full);\n  font-size: 0.9rem;\n  font-weight: 500;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN SWITCHING & TRANSITIONS                  */\n/* ═══════════════════════════════════════════════ */\n.screen {\n  display: none;\n  opacity: 0;\n  transform: translateY(16px);\n  transition: opacity 0.35s ease, transform 0.35s ease;\n}\n\n.screen.active {\n  display: block;\n  opacity: 1;\n  transform: translateY(0);\n}\n\n.hidden {\n  display: none !important;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* BUTTONS & CHIPS                                 */\n/* ═══════════════════════════════════════════════ */\n.btn {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  padding: 12px 24px;\n  border-radius: var(--radius-md);\n  font-size: 1rem;\n  font-weight: 700;\n  font-family: inherit;\n  cursor: pointer;\n  border: none;\n  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n  text-decoration: none;\n  white-space: nowrap;\n}\n\n.btn:active {\n  transform: scale(0.97);\n}\n\n.btn-primary {\n  background: linear-gradient(135deg, #00b4d8 0%, #0077b6 100%);\n  color: #ffffff;\n  box-shadow: 0 4px 16px rgba(0, 180, 216, 0.3);\n}\n\n.btn-primary:hover {\n  background: linear-gradient(135deg, #00e5ff 0%, #0091ff 100%);\n  box-shadow: 0 6px 20px rgba(0, 229, 255, 0.45);\n  transform: translateY(-2px);\n}\n\n.btn-secondary {\n  background: linear-gradient(135deg, #ffd166 0%, #f77f00 100%);\n  color: #1a1a2e;\n  box-shadow: 0 4px 16px rgba(255, 209, 102, 0.3);\n}\n\n.btn-secondary:hover {\n  background: linear-gradient(135deg, #ffe082 0%, #ff9800 100%);\n  transform: translateY(-2px);\n}\n\n.btn-outline {\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid var(--border-glass);\n  color: var(--text-main);\n}\n\n.btn-outline:hover {\n  background: rgba(255, 255, 255, 0.12);\n  border-color: var(--accent-cyan);\n}\n\n.btn-text {\n  background: transparent;\n  color: var(--text-muted);\n  padding: 8px 14px;\n}\n\n.btn-text:hover {\n  color: var(--text-main);\n  background: rgba(255, 255, 255, 0.05);\n}\n\n.btn-sm {\n  padding: 8px 14px;\n  font-size: 0.85rem;\n  border-radius: var(--radius-sm);\n}\n\n.btn-large {\n  padding: 16px 36px;\n  font-size: 1.15rem;\n  letter-spacing: 1px;\n}\n\n.btn-glow {\n  animation: pulseGlow 2.5s infinite;\n}\n\n@keyframes pulseGlow {\n  0%, 100% { box-shadow: 0 0 16px rgba(0, 229, 255, 0.35); }\n  50% { box-shadow: 0 0 28px rgba(0, 229, 255, 0.65); }\n}\n\n.icon-btn {\n  background: rgba(255, 255, 255, 0.06);\n  border: 1px solid var(--border-glass);\n  color: var(--text-main);\n  padding: 6px 14px;\n  border-radius: var(--radius-full);\n  font-size: 0.85rem;\n  cursor: pointer;\n  transition: all 0.2s;\n  font-family: inherit;\n}\n\n.icon-btn:hover {\n  background: rgba(255, 255, 255, 0.12);\n  border-color: var(--accent-cyan);\n}\n\n.btn-dice {\n  background: rgba(255, 255, 255, 0.08);\n  border: 1px solid var(--border-glass);\n  color: var(--text-main);\n  border-radius: var(--radius-md);\n  padding: 10px 14px;\n  font-size: 0.9rem;\n  cursor: pointer;\n  white-space: nowrap;\n  font-family: inherit;\n  transition: background 0.2s;\n}\n\n.btn-dice:hover {\n  background: rgba(255, 255, 255, 0.16);\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN 1: HERO & HOME CARDS                     */\n/* ═══════════════════════════════════════════════ */\n.hero-card {\n  background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  padding: 36px 32px;\n  text-align: center;\n  box-shadow: var(--shadow-card);\n}\n\n.hero-dive-icon {\n  font-size: 4rem;\n  margin-bottom: 8px;\n  filter: drop-shadow(0 4px 16px rgba(0, 229, 255, 0.3));\n}\n\n.hero-card h2 {\n  font-size: 1.8rem;\n  font-weight: 900;\n  color: #fff;\n  margin-bottom: 8px;\n}\n\n.hero-desc {\n  font-size: 0.95rem;\n  color: var(--text-muted);\n  max-width: 580px;\n  margin: 0 auto 28px;\n  line-height: 1.6;\n}\n\n.nickname-box {\n  max-width: 440px;\n  margin: 0 auto 32px;\n  text-align: left;\n}\n\n.nickname-box label {\n  display: block;\n  font-size: 0.85rem;\n  color: var(--text-muted);\n  margin-bottom: 6px;\n  font-weight: 500;\n}\n\n.input-with-action {\n  display: flex;\n  gap: 8px;\n}\n\n.input-with-action input {\n  flex: 1;\n  padding: 12px 16px;\n  font-size: 1rem;\n  background: rgba(3, 12, 27, 0.7);\n  border: 2px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  color: #ffffff;\n  outline: none;\n  font-family: inherit;\n  transition: border-color 0.2s;\n}\n\n.input-with-action input:focus {\n  border-color: var(--accent-cyan);\n  box-shadow: 0 0 12px rgba(0, 229, 255, 0.25);\n}\n\n.home-actions-grid {\n  display: grid;\n  grid-template-columns: 1fr 1fr;\n  gap: 20px;\n  margin-top: 10px;\n}\n\n.action-card {\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 24px 20px;\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  text-align: left;\n  transition: all 0.25s;\n}\n\n.action-card:hover {\n  background: rgba(255, 255, 255, 0.07);\n  border-color: rgba(0, 229, 255, 0.35);\n  transform: translateY(-2px);\n}\n\n.action-icon {\n  font-size: 2.2rem;\n  margin-bottom: 10px;\n}\n\n.action-card h3 {\n  font-size: 1.25rem;\n  font-weight: 700;\n  margin-bottom: 6px;\n  color: #fff;\n}\n\n.action-card p {\n  font-size: 0.85rem;\n  color: var(--text-muted);\n  margin-bottom: 18px;\n  flex: 1;\n}\n\n.join-input-group {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.join-input-group input {\n  padding: 12px 14px;\n  font-size: 1.1rem;\n  font-weight: 700;\n  letter-spacing: 3px;\n  text-align: center;\n  text-transform: uppercase;\n  background: rgba(3, 12, 27, 0.8);\n  border: 2px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  color: var(--accent-gold);\n  outline: none;\n  font-family: monospace, inherit;\n  transition: border-color 0.2s;\n}\n\n.join-input-group input:focus {\n  border-color: var(--accent-gold);\n  box-shadow: 0 0 12px rgba(255, 209, 102, 0.25);\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN 2: LOBBY & SETTINGS                      */\n/* ═══════════════════════════════════════════════ */\n.lobby-card {\n  background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  padding: 28px;\n  box-shadow: var(--shadow-card);\n}\n\n.code-banner {\n  text-align: center;\n  background: radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.12) 0%, rgba(0, 0, 0, 0.3) 100%);\n  border: 2px dashed rgba(0, 229, 255, 0.35);\n  border-radius: var(--radius-md);\n  padding: 20px 16px;\n  margin-bottom: 24px;\n}\n\n.code-title {\n  font-size: 0.85rem;\n  text-transform: uppercase;\n  color: var(--text-muted);\n  letter-spacing: 1px;\n  margin-bottom: 6px;\n}\n\n.code-display {\n  font-family: monospace, -apple-system, sans-serif;\n  font-size: 2.8rem;\n  font-weight: 900;\n  letter-spacing: 6px;\n  color: var(--accent-cyan);\n  text-shadow: 0 0 18px rgba(0, 229, 255, 0.6);\n  margin-bottom: 12px;\n}\n\n.code-buttons {\n  display: flex;\n  justify-content: center;\n  gap: 10px;\n  flex-wrap: wrap;\n}\n\n.room-tip {\n  font-size: 0.8rem;\n  color: var(--text-muted);\n  margin-top: 10px;\n}\n\n.lobby-grid {\n  display: grid;\n  grid-template-columns: 1fr 1.15fr;\n  gap: 24px;\n}\n\n.lobby-column {\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 20px;\n}\n\n.column-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 16px;\n  padding-bottom: 10px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.06);\n}\n\n.column-header h3 {\n  font-size: 1.1rem;\n  font-weight: 700;\n}\n\n.badge-count {\n  font-size: 0.85rem;\n  color: var(--accent-cyan);\n}\n\n.host-badge {\n  font-size: 0.75rem;\n  background: rgba(255, 209, 102, 0.15);\n  color: var(--accent-gold);\n  border: 1px solid rgba(255, 209, 102, 0.3);\n  padding: 2px 10px;\n  border-radius: var(--radius-full);\n}\n\n.players-list {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  max-height: 340px;\n  overflow-y: auto;\n}\n\n.player-item {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 14px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.06);\n  border-radius: var(--radius-md);\n  transition: all 0.2s;\n}\n\n.player-item.is-me {\n  border-color: var(--border-glow);\n  background: rgba(0, 229, 255, 0.08);\n}\n\n.p-emoji {\n  font-size: 1.6rem;\n}\n\n.p-info {\n  flex: 1;\n}\n\n.p-name {\n  font-size: 0.95rem;\n  font-weight: 600;\n  color: #fff;\n}\n\n.p-tag {\n  font-size: 0.7rem;\n  padding: 1px 6px;\n  border-radius: 4px;\n  background: rgba(255, 255, 255, 0.1);\n  color: var(--text-muted);\n  margin-left: 6px;\n}\n\n.p-tag.tag-host {\n  background: rgba(255, 209, 102, 0.25);\n  color: var(--accent-gold);\n  font-weight: 700;\n}\n\n/* Settings Form */\n.settings-form {\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n}\n\n.setting-item {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.setting-label {\n  display: flex;\n  justify-content: space-between;\n  font-size: 0.9rem;\n  color: var(--text-muted);\n}\n\n.setting-label strong {\n  color: var(--accent-cyan);\n}\n\n.chip-group {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.chip {\n  padding: 8px 14px;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-full);\n  color: var(--text-muted);\n  font-size: 0.85rem;\n  font-weight: 500;\n  cursor: pointer;\n  font-family: inherit;\n  transition: all 0.2s;\n}\n\n.chip:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: var(--text-main);\n}\n\n.chip.active {\n  background: rgba(0, 229, 255, 0.18);\n  border-color: var(--accent-cyan);\n  color: var(--accent-cyan);\n  font-weight: 700;\n  box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);\n}\n\n.chip.disabled {\n  pointer-events: none;\n  opacity: 0.6;\n}\n\n.lobby-actions {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 10px;\n  margin-top: 10px;\n  padding-top: 14px;\n  border-top: 1px solid rgba(255, 255, 255, 0.08);\n}\n\n.wait-host-text {\n  font-size: 0.9rem;\n  color: var(--accent-gold);\n  padding: 12px;\n  text-align: center;\n  animation: pulseOpacity 2s infinite;\n}\n\n@keyframes pulseOpacity {\n  0%, 100% { opacity: 0.7; }\n  50% { opacity: 1; }\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN 3: GAMEPLAY                              */\n/* ═══════════════════════════════════════════════ */\n.game-hud {\n  display: grid;\n  grid-template-columns: 1fr 1.3fr 1fr;\n  gap: 12px;\n  margin-bottom: 12px;\n}\n\n.hud-item {\n  background: var(--bg-card);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 12px 14px;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  text-align: center;\n}\n\n.hud-label {\n  font-size: 0.75rem;\n  color: var(--text-muted);\n  text-transform: uppercase;\n  letter-spacing: 0.5px;\n  margin-bottom: 2px;\n}\n\n.hud-val {\n  font-size: 1.15rem;\n  font-weight: 700;\n  color: #fff;\n}\n\n.depth-val {\n  color: var(--accent-cyan);\n  font-size: 1.35rem;\n}\n\n.depth-val small {\n  font-size: 0.8rem;\n  color: var(--text-muted);\n  font-weight: 400;\n}\n\n.timer-val {\n  color: var(--accent-gold);\n  font-size: 1.45rem;\n  font-family: monospace;\n}\n\n.timer-val.urgent {\n  color: #ff4757;\n  animation: pulseUrgent 0.6s infinite;\n}\n\n@keyframes pulseUrgent {\n  0%, 100% { transform: scale(1); }\n  50% { transform: scale(1.1); text-shadow: 0 0 14px #ff4757; }\n}\n\n.timer-bar-track {\n  width: 100%;\n  height: 6px;\n  background: rgba(255, 255, 255, 0.08);\n  border-radius: 3px;\n  overflow: hidden;\n  margin-bottom: 20px;\n}\n\n.timer-bar-fill {\n  height: 100%;\n  background: linear-gradient(90deg, var(--accent-cyan), var(--accent-gold));\n  border-radius: 3px;\n  width: 100%;\n  transition: width 0.1s linear;\n}\n\n.timer-bar-fill.urgent {\n  background: linear-gradient(90deg, #ff4757, #ff6b6b);\n}\n\n.question-card {\n  background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  padding: 36px 28px;\n  text-align: center;\n  box-shadow: var(--shadow-card);\n  margin-bottom: 20px;\n}\n\n.question-category-tag {\n  display: inline-block;\n  font-size: 0.75rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  background: rgba(0, 229, 255, 0.12);\n  color: var(--accent-cyan);\n  padding: 3px 12px;\n  border-radius: var(--radius-full);\n  margin-bottom: 12px;\n  letter-spacing: 1px;\n}\n\n.question-prompt {\n  font-size: 1.85rem;\n  font-weight: 900;\n  line-height: 1.4;\n  margin-bottom: 8px;\n  color: #ffffff;\n}\n\n.question-hint {\n  font-size: 0.9rem;\n  color: var(--text-muted);\n  margin-bottom: 28px;\n}\n\n.answer-box {\n  max-width: 520px;\n  margin: 0 auto;\n}\n\n.input-row {\n  display: flex;\n  gap: 10px;\n}\n\n.input-row input {\n  flex: 1;\n  padding: 14px 18px;\n  font-size: 1.1rem;\n  background: rgba(3, 12, 27, 0.8);\n  border: 2px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  color: #fff;\n  outline: none;\n  font-family: inherit;\n  transition: border-color 0.2s;\n}\n\n.input-row input:focus {\n  border-color: var(--accent-cyan);\n  box-shadow: 0 0 14px rgba(0, 229, 255, 0.3);\n}\n\n.answer-notice {\n  font-size: 0.8rem;\n  color: var(--text-dim);\n  margin-top: 10px;\n}\n\n/* Rejection shake */\n@keyframes shake {\n  0%, 100% { transform: translateX(0); }\n  20%, 60% { transform: translateX(-8px); }\n  40%, 80% { transform: translateX(8px); }\n}\n\n.input-row input.shake {\n  animation: shake 0.4s ease-in-out;\n  border-color: #ff4757 !important;\n}\n\n/* Accepted Box */\n.answer-accepted-box {\n  background: rgba(0, 0, 0, 0.35);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 24px;\n  max-width: 480px;\n  margin: 0 auto;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  gap: 10px;\n  animation: popIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n@keyframes popIn {\n  from { opacity: 0; transform: scale(0.9); }\n  to { opacity: 1; transform: scale(1); }\n}\n\n.accepted-tier-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 1.25rem;\n  font-weight: 900;\n  padding: 6px 20px;\n  border-radius: var(--radius-full);\n  color: #ffffff;\n}\n\n.accepted-stats {\n  display: flex;\n  gap: 8px;\n  font-size: 1.05rem;\n}\n\n.points-gain {\n  color: var(--accent-gold);\n  font-weight: 700;\n}\n\n.depth-gain {\n  color: var(--accent-cyan);\n}\n\n.accepted-word {\n  font-size: 0.95rem;\n  color: var(--text-muted);\n}\n\n.accepted-word strong {\n  color: #fff;\n}\n\n.waiting-others {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  font-size: 0.85rem;\n  color: var(--text-muted);\n  margin-top: 8px;\n}\n\n.spinner-bubble {\n  width: 14px;\n  height: 14px;\n  border-radius: 50%;\n  border: 2px solid var(--accent-cyan);\n  border-top-color: transparent;\n  animation: spin 0.8s linear infinite;\n}\n\n@keyframes spin {\n  to { transform: rotate(360deg); }\n}\n\n/* Live Players Progress */\n.live-players-status {\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 14px 18px;\n}\n\n.status-header {\n  display: flex;\n  justify-content: space-between;\n  font-size: 0.85rem;\n  color: var(--text-muted);\n  margin-bottom: 10px;\n}\n\n.status-header strong {\n  color: var(--accent-cyan);\n}\n\n.live-player-chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 8px;\n}\n\n.live-chip {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 6px 12px;\n  background: rgba(255, 255, 255, 0.05);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: var(--radius-full);\n  font-size: 0.85rem;\n  color: var(--text-muted);\n}\n\n.live-chip.done {\n  border-color: rgba(0, 229, 255, 0.4);\n  background: rgba(0, 229, 255, 0.12);\n  color: #fff;\n}\n\n.live-chip-status {\n  font-size: 0.75rem;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN 4: ROUND RESULTS                         */\n/* ═══════════════════════════════════════════════ */\n.results-card {\n  background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  padding: 32px 24px;\n  box-shadow: var(--shadow-card);\n}\n\n.results-header {\n  text-align: center;\n  margin-bottom: 24px;\n}\n\n.results-badge {\n  font-size: 0.8rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  background: rgba(255, 209, 102, 0.15);\n  color: var(--accent-gold);\n  padding: 4px 14px;\n  border-radius: var(--radius-full);\n  display: inline-block;\n  margin-bottom: 8px;\n}\n\n.results-header h2 {\n  font-size: 1.5rem;\n  color: #fff;\n  margin-bottom: 8px;\n}\n\n.next-round-countdown {\n  font-size: 0.95rem;\n  color: var(--text-muted);\n}\n\n.next-round-countdown strong {\n  color: var(--accent-cyan);\n  font-size: 1.3rem;\n  font-family: monospace;\n}\n\n.rr-list {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n\n.rr-item {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 12px 16px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid rgba(255, 255, 255, 0.08);\n  border-radius: var(--radius-md);\n  transition: all 0.2s;\n}\n\n.rr-rank {\n  font-size: 1.1rem;\n  font-weight: 900;\n  width: 28px;\n  text-align: center;\n  color: var(--text-muted);\n}\n\n.rr-rank.rank-1 { color: #ffd700; }\n.rr-rank.rank-2 { color: #c0c0c0; }\n.rr-rank.rank-3 { color: #cd7f32; }\n\n.rr-player {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  min-width: 140px;\n}\n\n.rr-name {\n  font-weight: 600;\n  font-size: 0.95rem;\n}\n\n.rr-answer-box {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n\n.rr-answer {\n  font-weight: 700;\n  color: #ffffff;\n}\n\n.rr-tier-badge {\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 2px 10px;\n  border-radius: var(--radius-full);\n  color: #fff;\n}\n\n.rr-points {\n  font-size: 1rem;\n  font-weight: 900;\n  color: var(--accent-cyan);\n  text-align: right;\n  min-width: 80px;\n}\n\n.rr-points small {\n  font-size: 0.75rem;\n  font-weight: 400;\n  color: var(--text-muted);\n  display: block;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* SCREEN 5: GAME OVER & PODIUM                    */\n/* ═══════════════════════════════════════════════ */\n.gameover-card {\n  background: var(--bg-card);\n  backdrop-filter: blur(16px);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  padding: 36px 24px;\n  text-align: center;\n  box-shadow: var(--shadow-card);\n}\n\n.gameover-crown {\n  font-size: 3.5rem;\n  margin-bottom: 6px;\n  filter: drop-shadow(0 0 16px rgba(255, 209, 102, 0.4));\n}\n\n.gameover-title {\n  font-size: 2rem;\n  font-weight: 900;\n  color: #fff;\n  margin-bottom: 6px;\n}\n\n.gameover-sub {\n  font-size: 0.95rem;\n  color: var(--text-muted);\n  margin-bottom: 28px;\n}\n\n/* Podium */\n.podium-wrap {\n  display: flex;\n  align-items: flex-end;\n  justify-content: center;\n  gap: 16px;\n  margin-bottom: 32px;\n  padding: 0 10px;\n}\n\n.podium-slot {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  width: 140px;\n}\n\n.podium-player {\n  margin-bottom: 10px;\n}\n\n.podium-avatar {\n  font-size: 2.4rem;\n}\n\n.podium-name {\n  font-size: 0.9rem;\n  font-weight: 700;\n  color: #fff;\n  white-space: nowrap;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  max-width: 130px;\n}\n\n.podium-depth {\n  font-size: 0.8rem;\n  color: var(--accent-cyan);\n  font-weight: 600;\n}\n\n.podium-bar {\n  width: 100%;\n  border-radius: var(--radius-md) var(--radius-md) 0 0;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: flex-start;\n  padding-top: 14px;\n  font-weight: 900;\n  font-size: 1.6rem;\n  color: #fff;\n}\n\n.podium-1 .podium-bar {\n  height: 140px;\n  background: linear-gradient(180deg, rgba(255, 215, 0, 0.4), rgba(255, 215, 0, 0.1));\n  border: 2px solid rgba(255, 215, 0, 0.6);\n}\n\n.podium-2 .podium-bar {\n  height: 105px;\n  background: linear-gradient(180deg, rgba(192, 192, 192, 0.4), rgba(192, 192, 192, 0.1));\n  border: 2px solid rgba(192, 192, 192, 0.6);\n}\n\n.podium-3 .podium-bar {\n  height: 80px;\n  background: linear-gradient(180deg, rgba(205, 127, 50, 0.4), rgba(205, 127, 50, 0.1));\n  border: 2px solid rgba(205, 127, 50, 0.6);\n}\n\n/* Final board list */\n.final-board-wrap {\n  text-align: left;\n  background: rgba(255, 255, 255, 0.03);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  padding: 20px;\n  margin-bottom: 24px;\n}\n\n.final-board-wrap h3 {\n  font-size: 1rem;\n  color: var(--text-muted);\n  margin-bottom: 14px;\n}\n\n.final-board-list {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n}\n\n.final-row {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  padding: 10px 14px;\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: var(--radius-sm);\n}\n\n.final-row.is-me {\n  background: rgba(0, 229, 255, 0.08);\n  border: 1px solid rgba(0, 229, 255, 0.3);\n}\n\n.final-rank {\n  font-weight: 900;\n  width: 24px;\n  color: var(--text-muted);\n}\n\n.final-name {\n  flex: 1;\n  font-weight: 600;\n}\n\n.final-depth {\n  font-weight: 700;\n  color: var(--accent-cyan);\n}\n\n.final-score {\n  font-size: 0.85rem;\n  color: var(--text-muted);\n}\n\n/* History Accordion */\n.history-accordion {\n  margin-bottom: 24px;\n  text-align: left;\n}\n\n.accordion-toggle {\n  width: 100%;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 12px 18px;\n  background: rgba(255, 255, 255, 0.04);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-md);\n  color: var(--text-main);\n  font-size: 0.9rem;\n  font-weight: 600;\n  cursor: pointer;\n  font-family: inherit;\n}\n\n.accordion-toggle:hover {\n  background: rgba(255, 255, 255, 0.08);\n}\n\n.history-content {\n  padding: 14px;\n  background: rgba(0, 0, 0, 0.25);\n  border: 1px solid var(--border-glass);\n  border-top: none;\n  border-radius: 0 0 var(--radius-md) var(--radius-md);\n  max-height: 320px;\n  overflow-y: auto;\n  display: flex;\n  flex-direction: column;\n  gap: 14px;\n}\n\n.history-q-block {\n  background: rgba(255, 255, 255, 0.03);\n  border-radius: var(--radius-sm);\n  padding: 10px 12px;\n}\n\n.history-q-title {\n  font-size: 0.85rem;\n  font-weight: 700;\n  color: var(--accent-cyan);\n  margin-bottom: 6px;\n}\n\n.history-q-answers {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px;\n}\n\n.history-ans-pill {\n  font-size: 0.75rem;\n  padding: 2px 8px;\n  border-radius: var(--radius-full);\n  background: rgba(255, 255, 255, 0.08);\n}\n\n.gameover-actions {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 12px;\n  flex-wrap: wrap;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* MODAL: RULES & RARITY TIERS                     */\n/* ═══════════════════════════════════════════════ */\n.modal-backdrop {\n  position: fixed;\n  inset: 0;\n  background: rgba(0, 0, 0, 0.75);\n  backdrop-filter: blur(8px);\n  z-index: 100;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n}\n\n.modal-card {\n  background: var(--bg-surface);\n  border: 1px solid var(--border-glass);\n  border-radius: var(--radius-lg);\n  max-width: 620px;\n  width: 100%;\n  max-height: 90vh;\n  display: flex;\n  flex-direction: column;\n  box-shadow: var(--shadow-card);\n  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n}\n\n.modal-header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 18px 24px;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.08);\n}\n\n.modal-header h3 {\n  font-size: 1.25rem;\n  color: #fff;\n}\n\n.btn-close {\n  background: transparent;\n  border: none;\n  color: var(--text-muted);\n  font-size: 1.4rem;\n  cursor: pointer;\n  line-height: 1;\n}\n\n.btn-close:hover {\n  color: #fff;\n}\n\n.modal-body {\n  padding: 20px 24px;\n  overflow-y: auto;\n  line-height: 1.6;\n  font-size: 0.9rem;\n  color: var(--text-muted);\n}\n\n.modal-body h4 {\n  font-size: 1rem;\n  color: #fff;\n  margin: 16px 0 6px;\n}\n\n.modal-body h4:first-child {\n  margin-top: 0;\n}\n\n.modal-body ul {\n  padding-left: 20px;\n}\n\n.modal-body li {\n  margin-bottom: 4px;\n}\n\n.tier-table {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin-top: 10px;\n}\n\n.tier-row {\n  display: grid;\n  grid-template-columns: 32px 140px 130px 1fr;\n  align-items: center;\n  gap: 8px;\n  padding: 8px 12px;\n  background: rgba(255, 255, 255, 0.04);\n  border-left: 3px solid var(--tier-c);\n  border-radius: 4px;\n  font-size: 0.8rem;\n}\n\n.t-emoji { font-size: 1.2rem; }\n.t-name { font-weight: 700; color: #fff; }\n.t-score { color: var(--tier-c); font-weight: 700; }\n.t-desc { color: var(--text-muted); font-size: 0.75rem; }\n\n.modal-footer {\n  padding: 14px 24px;\n  border-top: 1px solid rgba(255, 255, 255, 0.08);\n  display: flex;\n  justify-content: flex-end;\n}\n\n/* ═══════════════════════════════════════════════ */\n/* TOASTS                                          */\n/* ═══════════════════════════════════════════════ */\n.toast-container {\n  position: fixed;\n  bottom: 24px;\n  left: 50%;\n  transform: translateX(-50%);\n  z-index: 200;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  pointer-events: none;\n}\n\n.toast {\n  background: rgba(14, 38, 74, 0.95);\n  border: 1px solid var(--accent-cyan);\n  color: #fff;\n  padding: 10px 20px;\n  border-radius: var(--radius-full);\n  font-size: 0.9rem;\n  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);\n  pointer-events: auto;\n  animation: toastIn 0.3s ease, toastOut 0.3s ease 2.7s forwards;\n}\n\n@keyframes toastIn {\n  from { opacity: 0; transform: translateY(12px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes toastOut {\n  from { opacity: 1; transform: translateY(0); }\n  to { opacity: 0; transform: translateY(-8px); }\n}\n\n/* ═══════════════════════════════════════════════ */\n/* RESPONSIVE DESIGN                               */\n/* ═══════════════════════════════════════════════ */\n@media (max-width: 768px) {\n  .home-actions-grid {\n    grid-template-columns: 1fr;\n  }\n  .lobby-grid {\n    grid-template-columns: 1fr;\n  }\n  .question-prompt {\n    font-size: 1.45rem;\n  }\n  .code-display {\n    font-size: 2.2rem;\n  }\n  .tier-row {\n    grid-template-columns: 28px 1fr;\n    grid-template-rows: auto auto;\n  }\n  .t-score, .t-desc {\n    grid-column: 2 / -1;\n  }\n  .podium-wrap {\n    gap: 8px;\n  }\n  .podium-slot {\n    width: 96px;\n  }\n  .podium-1 .podium-bar { height: 110px; }\n  .podium-2 .podium-bar { height: 85px; }\n  .podium-3 .podium-bar { height: 65px; }\n}\n\n</style>\n</head>\n<body>\n\n<!-- Ambient Rising Ocean Bubbles -->\n<div class=\"bubbles\" id=\"bubblesContainer\"></div>\n\n<div class=\"app-container\">\n  <!-- Top Navigation Header -->\n  <header class=\"game-header\">\n    <div class=\"logo-area\" onclick=\"goHome()\">\n      <span class=\"logo-emoji\">🌊</span>\n      <div class=\"logo-text\">\n        <h1>亿中选一</h1>\n        <span class=\"logo-sub\">Krillion · 生活日常多人深潜版</span>\n      </div>\n    </div>\n    <div class=\"header-actions\">\n      <button class=\"icon-btn\" onclick=\"toggleRulesModal()\" title=\"游戏规则\">📖 规则</button>\n      <div id=\"playerBadge\" class=\"player-badge hidden\">\n        <span id=\"badgeEmoji\">🐟</span>\n        <span id=\"badgeName\">玩家</span>\n      </div>\n    </div>\n  </header>\n\n  <!-- ═══════════════════════════════════════════════ -->\n  <!-- SCREEN 1: HOME (创建房间 / 输入邀请码加入)     -->\n  <!-- ═══════════════════════════════════════════════ -->\n  <section id=\"screenHome\" class=\"screen active\">\n    <div class=\"hero-card\">\n      <div class=\"hero-dive-icon\">🤿</div>\n      <h2>越冷门，潜得越深！</h2>\n      <p class=\"hero-desc\">\n        与最多 <strong>10 位好友</strong> 实时对决！<br>\n        围绕生活日常主题作答，避开大家都会想到的答案，寻找最稀有、最惊艳的深海之解！\n      </p>\n\n      <!-- Nickname Input -->\n      <div class=\"nickname-box\">\n        <label for=\"inputNickname\">你的潜水员昵称：</label>\n        <div class=\"input-with-action\">\n          <input type=\"text\" id=\"inputNickname\" maxlength=\"12\" placeholder=\"输入昵称 (例如: 潜水小虾米)\" autocomplete=\"off\">\n          <button class=\"btn-dice\" onclick=\"randomNickname()\" title=\"随机昵称\">🎲 随机</button>\n        </div>\n      </div>\n\n      <!-- Main Action Grid -->\n      <div class=\"home-actions-grid\">\n        <!-- Card 1: Create Room -->\n        <div class=\"action-card action-create\">\n          <div class=\"action-icon\">👑</div>\n          <h3>创建新房间</h3>\n          <p>自动生成 5 位专属邀请码，自定义题目数量和作答倒计时。</p>\n          <button class=\"btn btn-primary\" onclick=\"handleCreateRoom()\">\n            <span>✨ 立即创建房间</span>\n          </button>\n        </div>\n\n        <!-- Card 2: Join Room -->\n        <div class=\"action-card action-join\">\n          <div class=\"action-icon\">🔑</div>\n          <h3>加入好友房间</h3>\n          <p>输入好友发来的 5 位房间邀请码，快速进入大厅。</p>\n          <div class=\"join-input-group\">\n            <input type=\"text\" id=\"inputRoomCode\" maxlength=\"5\" placeholder=\"5位邀请码 (如 ABCDE)\" autocomplete=\"off\">\n            <button class=\"btn btn-secondary\" onclick=\"handleJoinRoom()\">\n              <span>🚀 进入房间</span>\n            </button>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════════════════════════════════ -->\n  <!-- SCREEN 2: LOBBY (等待大厅 & 房主设置)           -->\n  <!-- ═══════════════════════════════════════════════ -->\n  <section id=\"screenLobby\" class=\"screen\">\n    <div class=\"lobby-card\">\n      <!-- Room Code Banner -->\n      <div class=\"code-banner\">\n        <div class=\"code-title\">房间邀请码 (Room Code)</div>\n        <div class=\"code-display\" id=\"lobbyCode\">-----</div>\n        <div class=\"code-buttons\">\n          <button class=\"btn btn-sm btn-outline\" onclick=\"copyRoomCode()\">\n            <span id=\"btnCopyCodeText\">📋 复制邀请码</span>\n          </button>\n          <button class=\"btn btn-sm btn-outline\" onclick=\"copyInviteLink()\">\n            <span id=\"btnCopyLinkText\">🔗 复制邀请链接</span>\n          </button>\n        </div>\n        <div class=\"room-tip\">💡 发送邀请码或链接给微信/QQ好友，好友打开即可直接加入！</div>\n      </div>\n\n      <div class=\"lobby-grid\">\n        <!-- Players List Column -->\n        <div class=\"lobby-column players-column\">\n          <div class=\"column-header\">\n            <h3>👥 潜水小队 <span id=\"lobbyPlayerCount\" class=\"badge-count\">(1/10)</span></h3>\n          </div>\n          <div class=\"players-list\" id=\"lobbyPlayersList\">\n            <!-- Rendered by JS -->\n          </div>\n        </div>\n\n        <!-- Room Settings Column -->\n        <div class=\"lobby-column settings-column\">\n          <div class=\"column-header\">\n            <h3>⚙️ 游戏设置</h3>\n            <span id=\"hostNotice\" class=\"host-badge\">👑 房主可调整</span>\n          </div>\n\n          <div class=\"settings-form\">\n            <!-- Number of questions -->\n            <div class=\"setting-item\">\n              <div class=\"setting-label\">\n                <span>🎯 题目数量：</span>\n                <strong id=\"settingNumText\">7 题</strong>\n              </div>\n              <div class=\"chip-group\" id=\"chipNumQuestions\">\n                <button class=\"chip\" data-val=\"3\" onclick=\"selectNumQuestions(3)\">3 题</button>\n                <button class=\"chip\" data-val=\"5\" onclick=\"selectNumQuestions(5)\">5 题</button>\n                <button class=\"chip active\" data-val=\"7\" onclick=\"selectNumQuestions(7)\">7 题 (经典)</button>\n                <button class=\"chip\" data-val=\"10\" onclick=\"selectNumQuestions(10)\">10 题</button>\n                <button class=\"chip\" data-val=\"12\" onclick=\"selectNumQuestions(12)\">12 题</button>\n              </div>\n            </div>\n\n            <!-- Time per round -->\n            <div class=\"setting-item\">\n              <div class=\"setting-label\">\n                <span>⏱️ 每题作答时间：</span>\n                <strong id=\"settingTimeText\">25 秒</strong>\n              </div>\n              <div class=\"chip-group\" id=\"chipTimePerRound\">\n                <button class=\"chip\" data-val=\"15\" onclick=\"selectTimePerRound(15)\">15 秒 (极速)</button>\n                <button class=\"chip\" data-val=\"20\" onclick=\"selectTimePerRound(20)\">20 秒</button>\n                <button class=\"chip active\" data-val=\"25\" onclick=\"selectTimePerRound(25)\">25 秒 (经典)</button>\n                <button class=\"chip\" data-val=\"35\" onclick=\"selectTimePerRound(35)\">35 秒</button>\n                <button class=\"chip\" data-val=\"45\" onclick=\"selectTimePerRound(45)\">45 秒 (休闲)</button>\n              </div>\n            </div>\n\n            <!-- Host Start Game Button -->\n            <div class=\"lobby-actions\">\n              <button id=\"btnStartGame\" class=\"btn btn-primary btn-large btn-glow\" onclick=\"handleStartGame()\">\n                <span>🌊 开始深潜挑战</span>\n              </button>\n              <div id=\"waitHostNotice\" class=\"wait-host-text hidden\">\n                ⏳ 正在等待房主开始游戏...\n              </div>\n              <button class=\"btn btn-text\" onclick=\"handleLeaveRoom()\">🚪 退出房间</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════════════════════════════════ -->\n  <!-- SCREEN 3: GAMEPLAY (比赛进行中)                 -->\n  <!-- ═══════════════════════════════════════════════ -->\n  <section id=\"screenGame\" class=\"screen\">\n    <!-- Top Game Status HUD -->\n    <div class=\"game-hud\">\n      <div class=\"hud-item round-badge\">\n        <span class=\"hud-label\">轮次</span>\n        <span class=\"hud-val\" id=\"hudRoundText\">第 1 / 7 题</span>\n      </div>\n\n      <div class=\"hud-item depth-badge\">\n        <span class=\"hud-label\">我的当前深度</span>\n        <span class=\"hud-val depth-val\"><span id=\"hudMyDepth\">0</span> <small>米</small></span>\n      </div>\n\n      <div class=\"hud-item timer-badge\">\n        <span class=\"hud-label\">剩余时间</span>\n        <span class=\"hud-val timer-val\" id=\"hudTimerText\">25</span>\n      </div>\n    </div>\n\n    <!-- Timer progress bar -->\n    <div class=\"timer-bar-track\">\n      <div class=\"timer-bar-fill\" id=\"timerBarFill\"></div>\n    </div>\n\n    <!-- Question Card -->\n    <div class=\"question-card\" id=\"questionCard\">\n      <div class=\"question-category-tag\">日常知识挑战</div>\n      <h2 class=\"question-prompt\" id=\"gamePrompt\">加载中...</h2>\n      <div class=\"question-hint\" id=\"gameHint\">提示加载中...</div>\n\n      <!-- Answer Input Area -->\n      <div class=\"answer-box\" id=\"answerBox\">\n        <div class=\"input-row\">\n          <input type=\"text\" id=\"gameAnswerInput\" placeholder=\"输入你的答案 (越冷门得分越高)...\" autocomplete=\"off\">\n          <button class=\"btn btn-primary\" id=\"btnSubmitAnswer\" onclick=\"handleSubmitAnswer()\">\n            <span>提交 ↵</span>\n          </button>\n        </div>\n        <div class=\"answer-notice\" id=\"answerNotice\">💡 答错或未收录不扣分，可无限次重新输入直到时间结束！</div>\n      </div>\n\n      <!-- Locked / Accepted Feedback -->\n      <div class=\"answer-accepted-box hidden\" id=\"acceptedBox\">\n        <div class=\"accepted-tier-pill\" id=\"acceptedTierPill\">\n          <span id=\"acceptedEmoji\">🐙</span>\n          <span id=\"acceptedTierName\">亿中选一</span>\n        </div>\n        <div class=\"accepted-stats\">\n          <span class=\"points-gain\" id=\"acceptedPointsGain\">+100 分</span>\n          <span class=\"depth-gain\" id=\"acceptedDepthGain\">· 下潜 1,000 米 🌊</span>\n        </div>\n        <div class=\"accepted-word\">\n          你的答案：<strong id=\"acceptedWordText\">答案</strong>\n        </div>\n        <div class=\"waiting-others\">\n          <div class=\"spinner-bubble\"></div>\n          <span>答案已锁定！等待其他潜水员作答...</span>\n        </div>\n      </div>\n    </div>\n\n    <!-- Live Players Answer Status -->\n    <div class=\"live-players-status\">\n      <div class=\"status-header\">\n        <span>全员作答进度：</span>\n        <strong id=\"liveProgressCount\">0 / 0 人已完成</strong>\n      </div>\n      <div class=\"live-player-chips\" id=\"livePlayerChips\">\n        <!-- Rendered by JS -->\n      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════════════════════════════════ -->\n  <!-- SCREEN 4: ROUND RESULTS (单轮排名)             -->\n  <!-- ═══════════════════════════════════════════════ -->\n  <section id=\"screenRoundResults\" class=\"screen\">\n    <div class=\"results-card\">\n      <div class=\"results-header\">\n        <span class=\"results-badge\" id=\"rrBadge\">第 1 题结算</span>\n        <h2 id=\"rrPrompt\">本题：说出一种常见的水果</h2>\n        <div class=\"next-round-countdown\">\n          下一题即将开始：<strong id=\"rrCountdownNum\">6</strong> 秒\n        </div>\n      </div>\n\n      <!-- Round Rankings Table -->\n      <div class=\"rr-list\" id=\"rrList\">\n        <!-- Rendered by JS -->\n      </div>\n    </div>\n  </section>\n\n  <!-- ═══════════════════════════════════════════════ -->\n  <!-- SCREEN 5: GAME OVER (终局排行榜与盛典)         -->\n  <!-- ═══════════════════════════════════════════════ -->\n  <section id=\"screenGameOver\" class=\"screen\">\n    <div class=\"gameover-card\">\n      <div class=\"gameover-crown\">🏆</div>\n      <h2 class=\"gameover-title\">深潜探索圆满结束！</h2>\n      <p class=\"gameover-sub\">恭喜各位潜水员完成本次深海知识挑战</p>\n\n      <!-- Podium for Top 3 -->\n      <div class=\"podium-wrap\" id=\"podiumWrap\">\n        <!-- Rendered by JS -->\n      </div>\n\n      <!-- Full Final Leaderboard -->\n      <div class=\"final-board-wrap\">\n        <h3>📊 最终下潜深度总榜</h3>\n        <div class=\"final-board-list\" id=\"finalBoardList\">\n          <!-- Rendered by JS -->\n        </div>\n      </div>\n\n      <!-- Question-by-Question History Accordion -->\n      <div class=\"history-accordion\">\n        <button class=\"accordion-toggle\" onclick=\"toggleHistory()\">\n          <span>📜 查看全场题目与大家作答记录</span>\n          <span id=\"historyArrow\">▼</span>\n        </button>\n        <div class=\"history-content hidden\" id=\"historyContent\">\n          <!-- Rendered by JS -->\n        </div>\n      </div>\n\n      <!-- Actions -->\n      <div class=\"gameover-actions\">\n        <button class=\"btn btn-secondary\" onclick=\"shareFinalReport()\">\n          <span id=\"btnShareText\">📋 复制我的战报</span>\n        </button>\n        <button id=\"btnPlayAgain\" class=\"btn btn-primary btn-glow\" onclick=\"handlePlayAgain()\">\n          <span>🔄 再来一局 (返回大厅)</span>\n        </button>\n        <button class=\"btn btn-text\" onclick=\"handleLeaveRoom()\">🚪 退出房间</button>\n      </div>\n    </div>\n  </section>\n</div>\n\n<!-- ═══════════════════════════════════════════════ -->\n<!-- MODAL: RULES & RARITY TIERS                     -->\n<!-- ═══════════════════════════════════════════════ -->\n<div class=\"modal-backdrop hidden\" id=\"rulesModal\" onclick=\"closeRulesModal(event)\">\n  <div class=\"modal-card\" onclick=\"event.stopPropagation()\">\n    <div class=\"modal-header\">\n      <h3>📖 游戏玩法与规则说明</h3>\n      <button class=\"btn-close\" onclick=\"toggleRulesModal()\">✕</button>\n    </div>\n    <div class=\"modal-body\">\n      <h4>🌊 什么是“亿中选一” (Krillion)？</h4>\n      <p>\n        在传统答题游戏中，大家往往争着抢最快、最显而易见的答案。而在<strong>亿中选一</strong>中：<br>\n        <strong>越冷门、越少人想到的正确答案，下潜深度越高！</strong>\n      </p>\n\n      <h4>⏱️ 规则细则</h4>\n      <ul>\n        <li><strong>作答时间：</strong>每题有设定好的倒计时（如25秒）。</li>\n        <li><strong>无限次尝试：</strong>如果输入的词不符合分类或未被收录，不会扣分，只耗费时间，可以立即重新输入！</li>\n        <li><strong>一锤定音：</strong>一旦命中任意收录的有效答案，该题立即锁定得分，等待其他玩家。</li>\n        <li><strong>超时惩罚：</strong>若倒计时归零仍未提交有效答案，该题得 0 分。</li>\n      </ul>\n\n      <h4>🎯 稀有度分级与得分</h4>\n      <div class=\"tier-table\">\n        <div class=\"tier-row\" style=\"--tier-c:#8bc34a;\">\n          <span class=\"t-emoji\">🦐</span>\n          <span class=\"t-name\">浮游 (Plankton)</span>\n          <span class=\"t-score\">+10 分 (100米)</span>\n          <span class=\"t-desc\">最容易想到的常见答案 (如: 水果中的苹果、香蕉)</span>\n        </div>\n        <div class=\"tier-row\" style=\"--tier-c:#cddc39;\">\n          <span class=\"t-emoji\">🐠</span>\n          <span class=\"t-name\">聪明 (Clever)</span>\n          <span class=\"t-score\">+15 分 (150米)</span>\n          <span class=\"t-desc\">略带思考的不错选择 (如: 橙子、柠檬、蓝莓)</span>\n        </div>\n        <div class=\"tier-row\" style=\"--tier-c:#ffeb3b;\">\n          <span class=\"t-emoji\">🐟</span>\n          <span class=\"t-name\">鱼群 (Schooler)</span>\n          <span class=\"t-score\">+30 分 (300米)</span>\n          <span class=\"t-desc\">跳出思维定势的优质答案 (如: 猕猴桃、火龙果、石榴)</span>\n        </div>\n        <div class=\"tier-row\" style=\"--tier-c:#ff9800;\">\n          <span class=\"t-emoji\">🐡</span>\n          <span class=\"t-name\">稀有 (Rare)</span>\n          <span class=\"t-score\">+60 分 (600米)</span>\n          <span class=\"t-desc\">小众且独特的答案 (如: 山竹、杨桃、百香果)</span>\n        </div>\n        <div class=\"tier-row\" style=\"--tier-c:#f44336;\">\n          <span class=\"t-emoji\">🦑</span>\n          <span class=\"t-name\">深海 (Deep Cut)</span>\n          <span class=\"t-score\">+85 分 (850米)</span>\n          <span class=\"t-desc\">资深知识玩家的选择 (如: 莲雾、释迦果、蛇皮果)</span>\n        </div>\n        <div class=\"tier-row\" style=\"--tier-c:#e040fb;\">\n          <span class=\"t-emoji\">🐙</span>\n          <span class=\"t-name\">亿中选一 (Krillion)</span>\n          <span class=\"t-score\">+100 分 (1000米)</span>\n          <span class=\"t-desc\">极其冷门惊艳的终极宝藏 (如: 嘉宝果、神秘果、佛手柑)</span>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button class=\"btn btn-primary\" onclick=\"toggleRulesModal()\">明白啦，去深潜！</button>\n    </div>\n  </div>\n</div>\n\n<!-- Toast Notifications -->\n<div id=\"toastContainer\" class=\"toast-container\"></div>\n\n<script>\n// ═══════════════════════════════════════════════════════════════\n// CLIENT STATE & UTILITIES\n// ═══════════════════════════════════════════════════════════════\nconst state = {\n  code: null,\n  playerId: null,\n  player: null,\n  roomState: null,\n  isHost: false,\n  eventSource: null,\n  timerInterval: null,\n  timeLeft: 25,\n  roundDuration: 25,\n  hasAnswered: false,\n  lastRoundResults: null,\n  finalLeaderboard: null,\n  roundHistory: null,\n};\n\nconst RANDOM_NICKNAMES = [\n  \"深潜小海豚\", \"发光水母\", \"极地白鲸\", \"深渊章鱼哥\", \"潜水小海獭\",\n  \"七彩海马\", \"寻宝寄居蟹\", \"珊瑚海龟\", \"飞鱼探险家\", \"深海虎鲸\",\n  \"夜光灯笼鱼\", \"洋流漫游者\", \"深蓝潜航员\", \"北极海豹\", \"金枪鱼队长\"\n];\n\nconst TIER_COLORS = {\n  \"浮游\": \"#8bc34a\",\n  \"聪明\": \"#cddc39\",\n  \"鱼群\": \"#ffeb3b\",\n  \"稀有\": \"#ff9800\",\n  \"深海\": \"#f44336\",\n  \"亿中选一\": \"#e040fb\",\n};\n\nconst TIER_EMOJIS = {\n  \"浮游\": \"🦐\",\n  \"聪明\": \"🐠\",\n  \"鱼群\": \"🐟\",\n  \"稀有\": \"🐡\",\n  \"深海\": \"🦑\",\n  \"亿中选一\": \"🐙\",\n};\n\n// ═══════════════════════════════════════════════════════════════\n// SOUND SYNTHESIS (Zero external assets needed!)\n// ═══════════════════════════════════════════════════════════════\nlet audioCtx = null;\nfunction getAudioContext() {\n  if (!audioCtx) {\n    const AudioContext = window.AudioContext || window.webkitAudioContext;\n    if (AudioContext) audioCtx = new AudioContext();\n  }\n  if (audioCtx && audioCtx.state === 'suspended') {\n    audioCtx.resume();\n  }\n  return audioCtx;\n}\n\nfunction playSound(type) {\n  try {\n    const ctx = getAudioContext();\n    if (!ctx) return;\n    const now = ctx.currentTime;\n\n    if (type === 'click') {\n      const osc = ctx.createOscillator();\n      const gain = ctx.createGain();\n      osc.type = 'sine';\n      osc.frequency.setValueAtTime(600, now);\n      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);\n      gain.gain.setValueAtTime(0.15, now);\n      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);\n      osc.connect(gain);\n      gain.connect(ctx.destination);\n      osc.start(now);\n      osc.stop(now + 0.05);\n    } else if (type === 'refuse') {\n      const osc = ctx.createOscillator();\n      const gain = ctx.createGain();\n      osc.type = 'sawtooth';\n      osc.frequency.setValueAtTime(180, now);\n      osc.frequency.setValueAtTime(140, now + 0.1);\n      gain.gain.setValueAtTime(0.2, now);\n      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);\n      osc.connect(gain);\n      gain.connect(ctx.destination);\n      osc.start(now);\n      osc.stop(now + 0.25);\n    } else if (type === 'accepted') {\n      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {\n        const osc = ctx.createOscillator();\n        const gain = ctx.createGain();\n        osc.type = 'triangle';\n        osc.frequency.setValueAtTime(freq, now + idx * 0.06);\n        gain.gain.setValueAtTime(0.18, now + idx * 0.06);\n        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.06 + 0.2);\n        osc.connect(gain);\n        gain.connect(ctx.destination);\n        osc.start(now + idx * 0.06);\n        osc.stop(now + idx * 0.06 + 0.2);\n      });\n    } else if (type === 'bubble') {\n      const osc = ctx.createOscillator();\n      const gain = ctx.createGain();\n      osc.type = 'sine';\n      osc.frequency.setValueAtTime(300 + Math.random() * 200, now);\n      osc.frequency.exponentialRampToValueAtTime(900 + Math.random() * 200, now + 0.08);\n      gain.gain.setValueAtTime(0.1, now);\n      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);\n      osc.connect(gain);\n      gain.connect(ctx.destination);\n      osc.start(now);\n      osc.stop(now + 0.08);\n    }\n  } catch (e) {\n    // Audio unavailable or blocked\n  }\n}\n\n// ═══════════════════════════════════════════════════════════════\n// SCREEN MANAGEMENT\n// ═══════════════════════════════════════════════════════════════\nfunction showScreen(screenId) {\n  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));\n  const target = document.getElementById(screenId);\n  if (target) target.classList.add('active');\n  window.scrollTo({ top: 0, behavior: 'smooth' });\n}\n\nfunction showToast(message) {\n  const container = document.getElementById('toastContainer');\n  const toast = document.createElement('div');\n  toast.className = 'toast';\n  toast.textContent = message;\n  container.appendChild(toast);\n  setTimeout(() => {\n    toast.remove();\n  }, 3000);\n}\n\n// ═══════════════════════════════════════════════════════════════\n// AMBIENT BUBBLES GENERATOR\n// ═══════════════════════════════════════════════════════════════\nfunction initBubbles() {\n  const container = document.getElementById('bubblesContainer');\n  const count = 15;\n  for (let i = 0; i < count; i++) {\n    createBubble(container);\n  }\n}\n\nfunction createBubble(container) {\n  const bubble = document.createElement('div');\n  bubble.className = 'bubble';\n  const size = 8 + Math.random() * 24;\n  const left = Math.random() * 100;\n  const duration = 7 + Math.random() * 12;\n  const delay = Math.random() * 10;\n\n  bubble.style.width = `${size}px`;\n  bubble.style.height = `${size}px`;\n  bubble.style.left = `${left}%`;\n  bubble.style.animationDuration = `${duration}s`;\n  bubble.style.animationDelay = `${delay}s`;\n\n  container.appendChild(bubble);\n}\n\n// ═══════════════════════════════════════════════════════════════\n// NICKNAME & URL INITIALIZATION\n// ═══════════════════════════════════════════════════════════════\nfunction randomNickname() {\n  const inp = document.getElementById('inputNickname');\n  const rand = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];\n  inp.value = rand;\n  playSound('bubble');\n}\n\nfunction checkUrlParams() {\n  const params = new URLSearchParams(window.location.search);\n  const room = params.get('room');\n  if (room) {\n    const codeInp = document.getElementById('inputRoomCode');\n    if (codeInp) codeInp.value = room.toUpperCase().trim();\n    showToast(`🔍 已自动填入邀请码: ${room.toUpperCase()}`);\n  }\n}\n\n// ═══════════════════════════════════════════════════════════════\n// ROOM ACTIONS (CREATE, JOIN, LEAVE)\n// ═══════════════════════════════════════════════════════════════\nasync function handleCreateRoom() {\n  playSound('click');\n  const nicknameInput = document.getElementById('inputNickname');\n  let nickname = nicknameInput.value.trim();\n  if (!nickname) {\n    randomNickname();\n    nickname = nicknameInput.value.trim();\n  }\n\n  try {\n    const res = await fetch('/api/create-room', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ nickname }),\n    });\n    const data = await res.json();\n    if (!res.ok) {\n      showToast(`❌ ${data.error || '创建房间失败'}`);\n      return;\n    }\n\n    state.code = data.code;\n    state.playerId = data.playerId;\n    state.player = data.player;\n    state.roomState = data.roomState;\n    state.isHost = true;\n\n    updatePlayerBadge();\n    connectSse(data.code, data.playerId);\n    renderLobby();\n    showScreen('screenLobby');\n    showToast(`👑 房间已创建！邀请码: ${data.code}`);\n  } catch (err) {\n    showToast('❌ 网络连接错误，请检查服务器');\n  }\n}\n\nasync function handleJoinRoom() {\n  playSound('click');\n  const nicknameInput = document.getElementById('inputNickname');\n  let nickname = nicknameInput.value.trim();\n  if (!nickname) {\n    randomNickname();\n    nickname = nicknameInput.value.trim();\n  }\n\n  const codeInput = document.getElementById('inputRoomCode');\n  const code = (codeInput.value || '').toUpperCase().trim();\n  if (!code) {\n    showToast('⚠️ 请输入 5 位房间邀请码');\n    codeInput.focus();\n    return;\n  }\n\n  try {\n    const res = await fetch('/api/join-room', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ code, nickname }),\n    });\n    const data = await res.json();\n    if (!res.ok) {\n      showToast(`❌ ${data.error || '加入房间失败'}`);\n      return;\n    }\n\n    state.code = data.code;\n    state.playerId = data.playerId;\n    state.player = data.player;\n    state.roomState = data.roomState;\n    state.isHost = data.roomState.hostId === data.playerId;\n\n    updatePlayerBadge();\n    connectSse(data.code, data.playerId);\n    renderLobby();\n    showScreen('screenLobby');\n    showToast(`🎉 成功加入房间: ${data.code}`);\n  } catch (err) {\n    showToast('❌ 网络连接错误，请检查服务器');\n  }\n}\n\nasync function handleLeaveRoom() {\n  playSound('click');\n  if (confirm('确定要退出当前房间吗？')) {\n    if (state.code && state.playerId) {\n      fetch('/api/leave-room', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({ code: state.code, playerId: state.playerId }),\n      }).catch(() => {});\n    }\n    disconnectSse();\n    state.code = null;\n    state.playerId = null;\n    state.player = null;\n    state.roomState = null;\n    state.isHost = false;\n    updatePlayerBadge();\n    showScreen('screenHome');\n  }\n}\n\nfunction updatePlayerBadge() {\n  const badge = document.getElementById('playerBadge');\n  if (state.player) {\n    badge.classList.remove('hidden');\n    document.getElementById('badgeEmoji').textContent = state.player.emoji;\n    document.getElementById('badgeName').textContent = state.player.nickname;\n  } else {\n    badge.classList.add('hidden');\n  }\n}\n\n// ═══════════════════════════════════════════════════════════════\n// SSE (SERVER-SENT EVENTS) REALTIME CONNECTION\n// ═══════════════════════════════════════════════════════════════\nfunction connectSse(code, playerId) {\n  disconnectSse();\n\n  const url = `/api/events?code=${encodeURIComponent(code)}&playerId=${encodeURIComponent(playerId)}`;\n  state.eventSource = new EventSource(url);\n\n  state.eventSource.addEventListener('connected', (e) => {\n    const data = JSON.parse(e.data);\n    state.roomState = data.roomState;\n    state.isHost = data.roomState.hostId === state.playerId;\n    renderLobby();\n  });\n\n  state.eventSource.addEventListener('player-list-updated', (e) => {\n    const data = JSON.parse(e.data);\n    if (state.roomState) {\n      state.roomState.players = data.players;\n    }\n    renderLobbyPlayers();\n    renderLivePlayerChips();\n    playSound('bubble');\n  });\n\n  state.eventSource.addEventListener('settings-updated', (e) => {\n    const data = JSON.parse(e.data);\n    if (state.roomState) {\n      state.roomState.settings = data.settings;\n    }\n    renderLobbySettings();\n    showToast(`⚙️ 房主更新了游戏设置`);\n  });\n\n  state.eventSource.addEventListener('host-changed', (e) => {\n    const data = JSON.parse(e.data);\n    if (state.roomState) {\n      state.roomState.hostId = data.hostId;\n    }\n    state.isHost = data.hostId === state.playerId;\n    renderLobby();\n    if (state.isHost) {\n      showToast('👑 你已成为新房主！');\n    }\n  });\n\n  state.eventSource.addEventListener('game-started', () => {\n    playSound('click');\n    showScreen('screenGame');\n    showToast('🌊 游戏开始！深潜启动！');\n  });\n\n  state.eventSource.addEventListener('round-start', (e) => {\n    const data = JSON.parse(e.data);\n    handleRoundStart(data);\n  });\n\n  state.eventSource.addEventListener('player-answered', (e) => {\n    const data = JSON.parse(e.data);\n    handlePlayerAnswered(data);\n  });\n\n  state.eventSource.addEventListener('round-end', (e) => {\n    const data = JSON.parse(e.data);\n    handleRoundEnd(data);\n  });\n\n  state.eventSource.addEventListener('game-over', (e) => {\n    const data = JSON.parse(e.data);\n    handleGameOver(data);\n  });\n\n  state.eventSource.addEventListener('back-to-lobby', (e) => {\n    const data = JSON.parse(e.data);\n    state.roomState = data.roomState;\n    state.isHost = data.roomState.hostId === state.playerId;\n    renderLobby();\n    showScreen('screenLobby');\n    showToast('🔄 已返回大厅，准备下一场冒险！');\n  });\n\n  state.eventSource.onerror = () => {\n    // SSE will automatically attempt reconnection\n  };\n}\n\nfunction disconnectSse() {\n  if (state.eventSource) {\n    state.eventSource.close();\n    state.eventSource = null;\n  }\n}\n\n// ═══════════════════════════════════════════════════════════════\n// LOBBY RENDERING & CONTROLS\n// ═══════════════════════════════════════════════════════════════\nfunction renderLobby() {\n  document.getElementById('lobbyCode').textContent = state.code || '-----';\n  renderLobbyPlayers();\n  renderLobbySettings();\n\n  const startBtn = document.getElementById('btnStartGame');\n  const waitNotice = document.getElementById('waitHostNotice');\n  const hostNotice = document.getElementById('hostNotice');\n\n  if (state.isHost) {\n    startBtn.classList.remove('hidden');\n    waitNotice.classList.add('hidden');\n    hostNotice.textContent = '👑 你是房主 (可调整设置)';\n  } else {\n    startBtn.classList.add('hidden');\n    waitNotice.classList.remove('hidden');\n    hostNotice.textContent = '🔒 房主正在设置...';\n  }\n}\n\nfunction renderLobbyPlayers() {\n  const players = (state.roomState && state.roomState.players) || [];\n  const countEl = document.getElementById('lobbyPlayerCount');\n  countEl.textContent = `(${players.length}/10)`;\n\n  const listEl = document.getElementById('lobbyPlayersList');\n  listEl.innerHTML = '';\n\n  players.forEach(p => {\n    const isMe = p.id === state.playerId;\n    const isHost = p.id === (state.roomState && state.roomState.hostId);\n\n    const item = document.createElement('div');\n    item.className = `player-item ${isMe ? 'is-me' : ''}`;\n    item.innerHTML = `\n      <span class=\"p-emoji\">${p.emoji}</span>\n      <div class=\"p-info\">\n        <span class=\"p-name\">${escapeHtml(p.nickname)}</span>\n        ${isMe ? '<span class=\"p-tag\">我</span>' : ''}\n        ${isHost ? '<span class=\"p-tag tag-host\">房主</span>' : ''}\n      </div>\n      <span style=\"font-size:0.8rem; color:var(--text-muted);\">准备就绪</span>\n    `;\n    listEl.appendChild(item);\n  });\n}\n\nfunction renderLobbySettings() {\n  const settings = (state.roomState && state.roomState.settings) || { numQuestions: 7, timePerRound: 25 };\n\n  document.getElementById('settingNumText').textContent = `${settings.numQuestions} 题`;\n  document.getElementById('settingTimeText').textContent = `${settings.timePerRound} 秒`;\n\n  // Update chip active classes\n  document.querySelectorAll('#chipNumQuestions .chip').forEach(chip => {\n    const val = parseInt(chip.dataset.val);\n    chip.classList.toggle('active', val === settings.numQuestions);\n    chip.classList.toggle('disabled', !state.isHost);\n  });\n\n  document.querySelectorAll('#chipTimePerRound .chip').forEach(chip => {\n    const val = parseInt(chip.dataset.val);\n    chip.classList.toggle('active', val === settings.timePerRound);\n    chip.classList.toggle('disabled', !state.isHost);\n  });\n}\n\nfunction selectNumQuestions(num) {\n  if (!state.isHost) return;\n  playSound('click');\n  updateRoomSettings(num, null);\n}\n\nfunction selectTimePerRound(time) {\n  if (!state.isHost) return;\n  playSound('click');\n  updateRoomSettings(null, time);\n}\n\nasync function updateRoomSettings(numQuestions, timePerRound) {\n  try {\n    await fetch('/api/update-settings', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        code: state.code,\n        playerId: state.playerId,\n        numQuestions,\n        timePerRound,\n      }),\n    });\n  } catch (err) {\n    showToast('❌ 修改设置失败');\n  }\n}\n\nasync function handleStartGame() {\n  if (!state.isHost) return;\n  playSound('click');\n  try {\n    const res = await fetch('/api/start-game', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ code: state.code, playerId: state.playerId }),\n    });\n    if (!res.ok) {\n      const data = await res.json();\n      showToast(`❌ ${data.error || '无法开始游戏'}`);\n    }\n  } catch (err) {\n    showToast('❌ 启动游戏失败');\n  }\n}\n\nfunction copyRoomCode() {\n  if (!state.code) return;\n  navigator.clipboard.writeText(state.code).then(() => {\n    const btn = document.getElementById('btnCopyCodeText');\n    btn.textContent = '✅ 已复制邀请码！';\n    playSound('click');\n    setTimeout(() => { btn.textContent = '📋 复制邀请码'; }, 2000);\n  });\n}\n\nfunction copyInviteLink() {\n  if (!state.code) return;\n  const link = `${window.location.origin}/?room=${state.code}`;\n  navigator.clipboard.writeText(link).then(() => {\n    const btn = document.getElementById('btnCopyLinkText');\n    btn.textContent = '✅ 已复制链接！';\n    playSound('click');\n    setTimeout(() => { btn.textContent = '🔗 复制邀请链接'; }, 2000);\n  });\n}\n\n// ═══════════════════════════════════════════════════════════════\n// GAMEPLAY (ROUND START, SUBMIT, TIMER)\n// ═══════════════════════════════════════════════════════════════\nfunction handleRoundStart(data) {\n  state.hasAnswered = false;\n  state.roundDuration = data.duration;\n  state.timeLeft = data.duration;\n\n  // Reset UI\n  document.getElementById('hudRoundText').textContent = `第 ${data.roundNum} / ${data.totalRounds} 题`;\n  document.getElementById('gamePrompt').textContent = data.prompt;\n  document.getElementById('gameHint').textContent = data.hint;\n\n  document.getElementById('answerBox').classList.remove('hidden');\n  document.getElementById('acceptedBox').classList.add('hidden');\n\n  const input = document.getElementById('gameAnswerInput');\n  input.value = '';\n  input.disabled = false;\n  input.focus();\n  document.getElementById('btnSubmitAnswer').disabled = false;\n\n  // Reset live chips\n  renderLivePlayerChips();\n\n  // Start timer\n  startTimer(data.duration);\n  showScreen('screenGame');\n}\n\nfunction startTimer(duration) {\n  clearInterval(state.timerInterval);\n  state.timeLeft = duration;\n  updateTimerUI();\n\n  state.timerInterval = setInterval(() => {\n    state.timeLeft -= 0.1;\n    if (state.timeLeft <= 0) {\n      state.timeLeft = 0;\n      clearInterval(state.timerInterval);\n      if (!state.hasAnswered) {\n        onTimeExpired();\n      }\n    }\n    updateTimerUI();\n  }, 100);\n}\n\nfunction updateTimerUI() {\n  const timerVal = document.getElementById('hudTimerText');\n  const bar = document.getElementById('timerBarFill');\n\n  const ceilSec = Math.ceil(state.timeLeft);\n  timerVal.textContent = ceilSec;\n\n  const pct = Math.max(0, Math.min(100, (state.timeLeft / state.roundDuration) * 100));\n  bar.style.width = `${pct}%`;\n\n  if (state.timeLeft <= 5) {\n    timerVal.classList.add('urgent');\n    bar.classList.add('urgent');\n  } else {\n    timerVal.classList.remove('urgent');\n    bar.classList.remove('urgent');\n  }\n}\n\nfunction onTimeExpired() {\n  const input = document.getElementById('gameAnswerInput');\n  input.disabled = true;\n  document.getElementById('btnSubmitAnswer').disabled = true;\n  showToast('⏰ 时间到！本题未作答');\n  playSound('refuse');\n}\n\nasync function handleSubmitAnswer() {\n  if (state.hasAnswered || state.timeLeft <= 0) return;\n\n  const input = document.getElementById('gameAnswerInput');\n  const answer = input.value.trim();\n  if (!answer) return;\n\n  try {\n    const res = await fetch('/api/submit-answer', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({\n        code: state.code,\n        playerId: state.playerId,\n        answer,\n      }),\n    });\n    const data = await res.json();\n\n    if (!data.accepted) {\n      // Rejection: shake input, play sound, clear and keep timer running\n      input.classList.add('shake');\n      playSound('refuse');\n      showToast(data.message || '❌ 不符合条件，再试试！');\n      setTimeout(() => {\n        input.classList.remove('shake');\n        input.value = '';\n        input.focus();\n      }, 400);\n      return;\n    }\n\n    // Accepted!\n    state.hasAnswered = true;\n    clearInterval(state.timerInterval);\n    playSound('accepted');\n\n    // Update Depth HUD\n    document.getElementById('hudMyDepth').textContent = (data.totalDepth || 0).toLocaleString();\n\n    // Show accepted box\n    document.getElementById('answerBox').classList.add('hidden');\n    const acceptedBox = document.getElementById('acceptedBox');\n    acceptedBox.classList.remove('hidden');\n\n    const pill = document.getElementById('acceptedTierPill');\n    pill.style.background = data.tierColor || '#00e5ff';\n    document.getElementById('acceptedEmoji').textContent = data.tierEmoji || '🐙';\n    document.getElementById('acceptedTierName').textContent = data.tier;\n\n    document.getElementById('acceptedPointsGain').textContent = `+${data.points} 分`;\n    document.getElementById('acceptedDepthGain').textContent = `· 下潜 ${data.depthSunk} 米 🌊`;\n    document.getElementById('acceptedWordText').textContent = data.answer;\n\n  } catch (err) {\n    showToast('❌ 提交答案失败，请重试');\n  }\n}\n\nfunction handlePlayerAnswered(data) {\n  document.getElementById('liveProgressCount').textContent =\n    `${data.answeredCount} / ${data.totalPlayers} 人已完成`;\n\n  if (data.playerId !== state.playerId) {\n    playSound('bubble');\n  }\n\n  // Update specific player's chip\n  renderLivePlayerChips();\n}\n\nfunction renderLivePlayerChips() {\n  const container = document.getElementById('livePlayerChips');\n  if (!container || !state.roomState) return;\n\n  container.innerHTML = '';\n  const players = state.roomState.players || [];\n\n  players.forEach(p => {\n    const chip = document.createElement('div');\n    const isDone = p.answered || (p.id === state.playerId && state.hasAnswered);\n    chip.className = `live-chip ${isDone ? 'done' : ''}`;\n    chip.innerHTML = `\n      <span>${p.emoji}</span>\n      <span>${escapeHtml(p.nickname)}</span>\n      <span class=\"live-chip-status\">${isDone ? '✅ 已交卷' : '⏳ 思考中'}</span>\n    `;\n    container.appendChild(chip);\n  });\n}\n\n// ═══════════════════════════════════════════════════════════════\n// ROUND RESULTS SCREEN\n// ═══════════════════════════════════════════════════════════════\nfunction handleRoundEnd(data) {\n  clearInterval(state.timerInterval);\n  state.lastRoundResults = data.results;\n\n  document.getElementById('rrBadge').textContent = `第 ${data.roundNum} / ${data.totalRounds} 题结算`;\n  document.getElementById('rrPrompt').textContent = `题目：${data.prompt}`;\n\n  const list = document.getElementById('rrList');\n  list.innerHTML = '';\n\n  data.results.forEach((r, idx) => {\n    const isMe = r.playerId === state.playerId;\n    const tierColor = r.tier ? (TIER_COLORS[r.tier] || '#00e5ff') : 'rgba(255,255,255,0.1)';\n    const tierEmoji = r.tier ? (TIER_EMOJIS[r.tier] || '🐠') : '❌';\n\n    const item = document.createElement('div');\n    item.className = 'rr-item';\n    if (isMe) item.style.border = '1px solid rgba(0, 229, 255, 0.4)';\n\n    item.innerHTML = `\n      <div class=\"rr-rank rank-${idx + 1}\">${idx + 1}</div>\n      <div class=\"rr-player\">\n        <span style=\"font-size:1.4rem;\">${r.emoji}</span>\n        <span class=\"rr-name\">${escapeHtml(r.nickname)} ${isMe ? '<small>(我)</small>' : ''}</span>\n      </div>\n      <div class=\"rr-answer-box\">\n        <span class=\"rr-answer\">${escapeHtml(r.answer)}</span>\n        ${r.tier ? `<span class=\"rr-tier-badge\" style=\"background:${tierColor};\">${tierEmoji} ${r.tier}</span>` : '<span style=\"color:var(--text-muted); font-size:0.8rem;\">未作答</span>'}\n      </div>\n      <div class=\"rr-points\">\n        +${r.points} 分\n        <small>累计 ${r.depth.toLocaleString()}米</small>\n      </div>\n    `;\n    list.appendChild(item);\n  });\n\n  // Countdown to next round\n  let sec = data.nextIn || 6;\n  const countEl = document.getElementById('rrCountdownNum');\n  countEl.textContent = sec;\n  const cdInterval = setInterval(() => {\n    sec--;\n    if (sec <= 0) {\n      clearInterval(cdInterval);\n    } else {\n      countEl.textContent = sec;\n    }\n  }, 1000);\n\n  showScreen('screenRoundResults');\n  playSound('bubble');\n}\n\n// ═══════════════════════════════════════════════════════════════\n// GAME OVER SCREEN & PODIUM\n// ═══════════════════════════════════════════════════════════════\nfunction handleGameOver(data) {\n  clearInterval(state.timerInterval);\n  state.finalLeaderboard = data.leaderboard;\n  state.roundHistory = data.roundHistory;\n\n  renderPodium(data.leaderboard);\n  renderFinalBoard(data.leaderboard);\n  renderHistoryAccordion(data.roundHistory);\n\n  const playAgainBtn = document.getElementById('btnPlayAgain');\n  if (state.isHost) {\n    playAgainBtn.classList.remove('hidden');\n  } else {\n    playAgainBtn.classList.add('hidden');\n  }\n\n  showScreen('screenGameOver');\n  playSound('accepted');\n}\n\nfunction renderPodium(leaderboard) {\n  const wrap = document.getElementById('podiumWrap');\n  wrap.innerHTML = '';\n\n  const top3 = leaderboard.slice(0, 3);\n  // Reorder for visual podium: 2nd on left, 1st center, 3rd on right\n  const order = [1, 0, 2];\n\n  order.forEach(targetIdx => {\n    if (targetIdx >= top3.length) return;\n    const p = top3[targetIdx];\n    const rank = targetIdx + 1;\n    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';\n\n    const slot = document.createElement('div');\n    slot.className = `podium-slot podium-${rank}`;\n    slot.innerHTML = `\n      <div class=\"podium-player\">\n        <div class=\"podium-avatar\">${p.emoji}</div>\n        <div class=\"podium-name\">${escapeHtml(p.nickname)}</div>\n        <div class=\"podium-depth\">${p.depth.toLocaleString()} 米</div>\n      </div>\n      <div class=\"podium-bar\">\n        <span>${medal}</span>\n      </div>\n    `;\n    wrap.appendChild(slot);\n  });\n}\n\nfunction renderFinalBoard(leaderboard) {\n  const list = document.getElementById('finalBoardList');\n  list.innerHTML = '';\n\n  leaderboard.forEach((p, idx) => {\n    const isMe = p.playerId === state.playerId;\n    const row = document.createElement('div');\n    row.className = `final-row ${isMe ? 'is-me' : ''}`;\n    row.innerHTML = `\n      <span class=\"final-rank\">#${idx + 1}</span>\n      <span style=\"font-size:1.3rem;\">${p.emoji}</span>\n      <span class=\"final-name\">${escapeHtml(p.nickname)} ${isMe ? '<small style=\"color:var(--accent-cyan);\">(我)</small>' : ''}</span>\n      <span class=\"final-depth\">${p.depth.toLocaleString()} 米</span>\n      <span class=\"final-score\">${p.totalScore} 分</span>\n    `;\n    list.appendChild(row);\n  });\n}\n\nfunction renderHistoryAccordion(history) {\n  const container = document.getElementById('historyContent');\n  container.innerHTML = '';\n\n  (history || []).forEach((item, idx) => {\n    const block = document.createElement('div');\n    block.className = 'history-q-block';\n    block.innerHTML = `\n      <div class=\"history-q-title\">第 ${idx + 1} 题：${escapeHtml(item.prompt)}</div>\n      <div class=\"history-q-answers\">\n        ${item.results.map(r => `\n          <span class=\"history-ans-pill\" style=\"border-left: 2px solid ${r.tier ? (TIER_COLORS[r.tier] || '#fff') : '#555'};\">\n            ${r.emoji} <strong>${escapeHtml(r.nickname)}:</strong> ${escapeHtml(r.answer)} (${r.tier || '未答'} +${r.points}分)\n          </span>\n        `).join('')}\n      </div>\n    `;\n    container.appendChild(block);\n  });\n}\n\nfunction toggleHistory() {\n  const content = document.getElementById('historyContent');\n  const arrow = document.getElementById('historyArrow');\n  content.classList.toggle('hidden');\n  arrow.textContent = content.classList.contains('hidden') ? '▼' : '▲';\n}\n\nfunction shareFinalReport() {\n  if (!state.finalLeaderboard) return;\n  const myRecord = state.finalLeaderboard.find(p => p.playerId === state.playerId);\n  const myDepth = myRecord ? myRecord.depth : 0;\n  const myScore = myRecord ? myRecord.totalScore : 0;\n\n  const text =\n`🌊 亿中选一 (Krillion 中文版)\n我的深潜成绩：${myDepth.toLocaleString()} 米 (${myScore}分)\n快来和我一起挑战最冷门生活知识：\n${window.location.origin}`;\n\n  navigator.clipboard.writeText(text).then(() => {\n    const btn = document.getElementById('btnShareText');\n    btn.textContent = '✅ 已复制战报！快发给好友吧';\n    playSound('click');\n    setTimeout(() => { btn.textContent = '📋 复制我的战报'; }, 2500);\n  });\n}\n\nasync function handlePlayAgain() {\n  if (!state.isHost) return;\n  playSound('click');\n  try {\n    await fetch('/api/play-again', {\n      method: 'POST',\n      headers: { 'Content-Type': 'application/json' },\n      body: JSON.stringify({ code: state.code, playerId: state.playerId }),\n    });\n  } catch (err) {\n    showToast('❌ 重启游戏失败');\n  }\n}\n\n// ═══════════════════════════════════════════════════════════════\n// RULES MODAL & LOGO NAVIGATION\n// ═══════════════════════════════════════════════════════════════\nfunction toggleRulesModal() {\n  playSound('click');\n  const modal = document.getElementById('rulesModal');\n  modal.classList.toggle('hidden');\n}\n\nfunction closeRulesModal(e) {\n  const modal = document.getElementById('rulesModal');\n  modal.classList.add('hidden');\n}\n\nfunction goHome() {\n  if (!state.code) {\n    showScreen('screenHome');\n  }\n}\n\nfunction escapeHtml(str) {\n  if (!str) return '';\n  return str.toString()\n    .replace(/&/g, '&amp;')\n    .replace(/</g, '&lt;')\n    .replace(/>/g, '&gt;')\n    .replace(/\"/g, '&quot;')\n    .replace(/'/g, '&#39;');\n}\n\n// ═══════════════════════════════════════════════════════════════\n// KEYBOARD SHORTCUTS\n// ═══════════════════════════════════════════════════════════════\ndocument.addEventListener('keydown', (e) => {\n  if (e.key === 'Enter') {\n    const joinInput = document.getElementById('inputRoomCode');\n    const answerInput = document.getElementById('gameAnswerInput');\n\n    if (document.activeElement === joinInput) {\n      handleJoinRoom();\n    } else if (document.activeElement === answerInput) {\n      handleSubmitAnswer();\n    }\n  }\n});\n\n// ═══════════════════════════════════════════════════════════════\n// INITIALIZATION ON LOAD\n// ═══════════════════════════════════════════════════════════════\nwindow.addEventListener('DOMContentLoaded', () => {\n  initBubbles();\n  randomNickname();\n  checkUrlParams();\n});\n\n</script>\n</body>\n</html>\n";

function getMultiplayerHtml() {
  const candidates = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(process.cwd(), 'public', 'index.html'),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) {
        const str = fs.readFileSync(c, 'utf8');
        if (str.includes('lobbyCode') || str.includes('handleCreateRoom')) {
          return str;
        }
      }
    } catch (e) {}
  }
  return EMBEDDED_MULTIPLAYER_HTML;
}

  // ── ROOM STATE POLLING FALLBACK ──
  if (pathname === '/api/room-state' && req.method === 'GET') {
    const code = (url.searchParams.get('code') || '').toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return sendJson(res, 404, { error: 'Room not found' });
    return sendJson(res, 200, { roomState: getRoomState(room) });
  }

  // ── STATIC FILE SERVING ──
  if (pathname === '/' || pathname === '/index.html') {
    const content = getMultiplayerHtml();
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    });
    return res.end(content);
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('🌊 亿中选一 (Krillion Multiplayer) 服务启动成功！');
  console.log('📍 运行端口: ' + PORT);
  console.log('====================================================');
});
