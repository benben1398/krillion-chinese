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
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
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

  // ── STATIC FILE SERVING ──
  const publicDir = path.join(__dirname, 'public');
  if (pathname === '/' || pathname === '/index.html') {
    return serveStatic(res, path.join(publicDir, 'index.html'), 'text/html; charset=utf-8');
  }
  if (pathname === '/style.css') {
    return serveStatic(res, path.join(publicDir, 'style.css'), 'text/css; charset=utf-8');
  }
  if (pathname === '/app.js') {
    return serveStatic(res, path.join(publicDir, 'app.js'), 'application/javascript; charset=utf-8');
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`🌊 亿中选一 (Krillion Multiplayer) 服务启动成功！`);
  console.log(`📍 本地访问:    http://localhost:${PORT}`);
  console.log(`📱 局域网/好友: http://10.20.188.37:${PORT}`);
  console.log('====================================================');
});
