/* ============================================================
   咩&砚 · YumYum 外卖 · 商户数据（80 家 × 每店 10 样）
   格式：[店名, 分类, 标签, 菜名:价, 菜名:价, ...]
   分类：food 正餐 / dessert 甜点 / drink 饮品 / market 超市
        fruit 水果 / breakfast 早餐 / night 夜宵
   ============================================================ */
window.YUM_RAW = [
/* ---------- 正餐 · 20 ---------- */
['山下里·现炒小馆','food','满30减15|准时达','宫保鸡丁:26','黑椒牛柳:32','番茄炒蛋:18','清炒时蔬:16','蒜蓉粉丝虾:48','干煸四季豆:26','糖醋里脊:34','酸辣汤:18','白饭:5','可乐:8'],
['一碗一面·手工面馆','food','满20减8|招牌','招牌牛肉面:26','番茄鸡蛋面:20','葱油拌面:16','红油抄手:18','酸辣肥牛面:28','榨菜肉丝面:22','卤蛋:6','海带丝:10','冻豆浆:12','酸梅汤:14'],
['金汤记·酸菜鱼','food','满50减18|下饭推荐','金汤酸菜鱼:39','麻辣水煮鱼:42','藤椒鱼片:40','酸菜鱼米线:45','红糖糍粑:12','干锅土豆片:22','凉拌木耳:18','蒜蓉娃娃菜:24','白饭:5','酸梅汤:12'],
['咕嘟·韩式拌饭','food','新客减6|韩式风味','石锅牛肉拌饭:29','泡菜五花肉饭:27','部队锅:36','海鲜饼:22','炸鸡半份:38','辣炒年糕:26','海带汤:14','泡菜:8','紫菜包饭:18','韩式汽水:12'],
['元气日料·寿司','food','品质优选','三文鱼刺身:48','鳗鱼寿司:42','加州卷:28','味噌汤:10','吞拿鱼军舰:18','玉子烧:16','天妇罗虾:32','蟹柳沙律:22','茶碗蒸:14','玄米茶:8'],
['深水埗·明记茶餐厅','food','满40减10|街坊推荐','干炒牛河:48','菠萝油:22','冻柠茶:18','叉烧饭:42','西多士:26','滑蛋虾仁饭:48','咖喱牛腩饭:52','冻奶茶:20','例汤:15','油占多:18'],
['甘牌烧鹅·烧味','food','招牌烧味','烧鹅饭:58','叉烧饭:42','油鸡饭:45','例汤:15','烧肉饭:48','双拼饭:58','卤水豆腐:18','青菜:20','酸姜:8','冻柠茶:18'],
['谭仔米线·尖沙咀','food','满35减8|米线首选','麻辣米线:38','酸辣米线:38','土匪鸡翼:32','冻奶茶:16','清汤米线:36','番茄米线:40','加腩肉:18','加腐竹:8','加墨鱼丸:12','柠檬茶:18'],
['池记云吞面','food','老字号','鲜虾云吞面:45','牛腩捞面:52','炸云吞:38','油菜:18','水饺面:46','蚝油捞面:42','牛丸汤:38','腐乳通菜:22','冻柠茶:16','酸梅汤:15'],
['川味观·麻辣香锅','food','满50减15|重辣','麻辣香锅:48','毛血旺:42','水煮牛肉:45','冰粉:12','干锅虾:68','辣子鸡:48','蒜泥白肉:38','凉拌黄瓜:16','白饭:5','酸辣汤:18'],
['阿婆牛杂·车仔面','food','怀旧味','车仔面三𩠌:42','牛杂:38','咖喱鱼蛋:18','萝卜:15','车仔面四𩠌:52','加牛腩:22','加猪皮:10','加鱼蛋:12','油菜:16','豆浆:10'],
['泰香米·泰国菜','food','异国料理','冬阴功汤:42','泰式炒河粉:38','青咖喱鸡:40','芒果糯米饭:28','泰式生虾:48','香茅猪颈肉:42','泰式炒饭:36','虾饼:32','椰汁西米露:22','泰式奶茶:24'],
['西贡越南粉','food','清爽','生牛肉河粉:42','香茅猪扒饭:45','越式春卷:28','滴漏咖啡:22','牛丸河粉:40','鸡丝河粉:38','越式法包:38','牛油果奶昔:32','青木瓜沙律:26','椰青:28'],
['老碗面·兰州拉面','food','现拉现煮','牛肉拉面:28','羊肉串:18','大盘鸡:58','手抓羊肉:68','牛肉炒面:32','番茄鸡蛋面:24','烤羊排:88','凉皮:18','酸奶:12','大麦茶:10'],
['湘辣坊·湖南菜','food','满60减20|够辣','剁椒鱼头:58','小炒肉:38','干锅花菜:32','擂辣椒皮蛋:22','辣子鸡:48','农家小炒肉:42','酸豆角肉末:28','紫苏黄瓜:22','白饭:5','王老吉:10'],
['味千·猪骨拉面','food','日式','猪骨拉面:42','叉烧拉面:48','煎饺:22','溏心蛋:12','味噌拉面:44','地狱拉面:46','炸鸡块:32','海苔:8','炒饭:28','乌龙茶:12'],
['煲仔王·炭火煲仔饭','food','冬天限定','腊味煲仔饭:48','窝蛋牛肉煲仔饭:52','黄鳝煲仔饭:58','例汤:15','滑鸡煲仔饭:46','田鸡煲仔饭:56','咸鱼鸡粒煲仔饭:50','油菜:18','豉油:8','冻柠茶:16'],
['必胜客·薄饼','food','满80减25','超级至尊薄饼:88','夏威夷薄饼:78','烤鸡翼:38','蒜香包:22','海鲜薄饼:92','芝士条:42','意式肉酱面:58','凯撒沙律:38','薯格:26','可乐:12'],
['麦当劳·东涌','food','24小时','巨无霸:42','麦乐鸡6件:28','薯条:18','麦旋风:22','双层芝士汉堡:38','鱼柳包:32','猪柳蛋汉堡:36','苹果派:14','汽水:12','咖啡:16'],
['珍姐·猪脚饭','food','下饭','卤猪脚饭:32','卤水拼盘:45','卤蛋:8','酸菜:18','卤大肠饭:42','卤鸭饭:38','卤豆腐:12','青菜:16','例汤:12','冻茶:10'],
/* ---------- 甜点 · 10 ---------- */
['满记甜品','dessert','满40减10|港式糖水','杨枝甘露:38','芒果班戟:32','芝麻糊:22','炖奶:28','榴莲班戟:42','红豆沙:20','芒果糯米糍:26','杏仁茶:22','凉粉:18','椰汁西米露:22'],
['佳佳甜品','dessert','老店','芝麻糊:22','核桃糊:22','绿豆爽:20','汤圆:26','花生糊:22','红豆沙:20','腐竹糖水:22','木瓜炖雪耳:28','蛋散:12','擂沙汤圆:28'],
['利强记·鸡蛋仔','dessert','即做即食','原味鸡蛋仔:22','巧克力鸡蛋仔:26','格仔饼:24','冻柠茶:18','芝士鸡蛋仔:28','抹茶鸡蛋仔:28','香蕉糕:20','牛油格仔饼:26','冻奶茶:20','柠乐:18'],
['泰昌饼家','dessert','蛋挞名店','蛋挞:10','沙翁:12','鸡批:14','老婆饼:12','椰挞:10','蝴蝶酥:14','光酥饼:8','牛油曲奇:16','菠萝包:12','奶茶:16'],
['甜在心·豆花','dessert','满25减5','芋圆豆花:28','黑糖珍珠豆花:30','红豆豆花:22','仙草冻:18','花生豆花:24','绿豆豆花:22','综合豆花:32','豆浆:12','油条:10','加芋圆:8'],
['提拉米苏工房','dessert','手作','提拉米苏:38','芝士蛋糕:42','泡芙:18','布朗尼:32','草莓蛋糕:42','拿破仑:36','蛋挞:14','可丽露:18','马卡龙3粒:32','美式咖啡:18'],
['糖水铺·杨枝甘露','dessert','真材实料','杨枝甘露:32','椰汁西米露:22','芋头西米露:26','凉粉:18','芝麻糊:20','红豆沙:20','绿豆沙:20','番薯糖水:22','腐竹白果:22','姜汁撞奶:28'],
['北海道牛乳蛋糕','dessert','日本直送','半熟芝士:38','牛乳蛋糕:42','蛋卷:22','布丁:18','抹茶蛋糕:42','草莓蛋糕:45','芝士条:32','牛乳布丁:20','泡芙:16','牛奶:28'],
['阿元·传统糕饼','dessert','怀旧','红豆糕:18','马蹄糕:18','萝卜糕:22','白糖糕:16','芋头糕:20','芝麻糕:18','绿豆糕:18','砵仔糕:12','煎堆:12','麦芽糖饼:14'],
['雪糕屋·手作','dessert','手工雪糕','抹茶雪糕:32','云呢拿雪糕:28','芒果雪糕:30','榴莲雪糕:38','朱古力雪糕:30','草莓雪糕:28','双球雪糕:48','加雪糕筒:6','配窝夫:22','奶昔:32'],
/* ---------- 饮品 · 12 ---------- */
['茶汤会·手摇','drink','满20减5','珍珠奶茶:26','四季春茶:22','冬瓜柠檬:22','芝士奶盖:28','芋圆奶茶:32','乌龙奶茶:26','芒果绿茶:28','蜂蜜柠檬:22','百香双响炮:30','仙草冻奶茶:30'],
['天仁茗茶','drink','茶香','913茶王:28','珍珠奶绿:26','柠檬绿茶:22','鲜奶茶:30','乌龙拿铁:32','抹茶拿铁:34','桂圆红枣茶:28','洛神花茶:26','冷泡茶:30','茶冻奶茶:32'],
['贡茶','drink','买一送一','奶盖绿:28','芋圆奶茶:32','冬瓜茶:22','多多绿:26','奶盖乌龙:30','红豆奶茶:30','百香果绿:28','蜂蜜绿茶:24','布丁奶茶:30','芋头奶绿:34'],
['兰芳园·丝袜奶茶','drink','港式经典','丝袜奶茶:22','鸳鸯:24','冻柠茶:20','猪扒包:32','冻奶茶:24','热奶茶:20','咸柠七:24','奶油多:18','西多士:26','红豆冰:26'],
['华星冰室·冻奶茶','drink','冰室','冻奶茶:22','红豆冰:26','冻咖啡:24','奶油多:18','冻柠茶:20','菠萝油:22','西多士:26','鸳鸯:24','冻朱古力:26','蛋治:22'],
['蜜雪冰城','drink','便宜大碗','柠檬水:8','珍珠奶茶:12','圣代:8','摇摇奶昔:12','草莓摇摇:8','满杯百香果:10','摩天脆脆:6','咖啡:9','芝士奶盖茶:14','杨枝甘露:14'],
['喜茶','drink','满30减8','多肉葡萄:32','芝芝莓莓:32','波波奶茶:28','满杯红柚:26','芝芝芒芒:30','多肉桃桃:30','烤黑糖波波:30','纯绿妍:20','芝芝抹茶:32','生打椰奶:26'],
['星巴克','drink','咖啡','拿铁:38','美式:32','焦糖玛奇朵:42','抹茶星冰乐:42','卡布奇诺:38','摩卡:42','冷萃:36','燕麦拿铁:40','牛角包:26','芝士蛋糕:38'],
['瑞幸咖啡','drink','快取','生椰拿铁:22','厚乳拿铁:24','美式:15','橙C美式:20','生酪拿铁:26','丝绒拿铁:24','青苹果气泡:20','澳瑞白:24','可颂:18','巴斯克:28'],
['台式冬瓜茶铺','drink','古早味','冬瓜茶:18','冬瓜柠檬:22','仙草冻奶:26','芋圆奶茶:30','冬瓜青草茶:20','珍珠冬瓜:22','黑糖冬瓜:24','冬瓜鲜奶:26','仙草蜜:20','冬瓜菊花:22'],
['手打柠檬茶','drink','现打','鸭屎香柠檬茶:22','茉莉柠檬茶:20','香水柠檬茶:26','荔枝柠檬茶:24','白桃柠檬茶:24','青提柠檬茶:26','菠萝柠檬茶:24','百香果柠檬:22','薄荷柠檬:22','柠檬绿茶:20'],
['泰国手标奶茶','drink','泰式','泰式奶茶:26','绿奶茶:26','椰子水:22','柠檬苏打:20','泰式咖啡:24','斑斓奶茶:28','椰奶冰沙:28','芒果冰沙:30','柠檬茶:22','椰青:26'],
/* ---------- 超市 · 8 ---------- */
['惠康 Wellcome','market','日常补给','鸡蛋10只:32','牛奶1L:22','白米5kg:68','方包:18','食油2L:42','盐:6','砂糖:18','意粉:22','罐头汤:16','家庭装雪糕:48'],
['百佳 PARKnSHOP','market','满60减10','矿泉水6支:28','即食面5包:32','饼干:22','纸巾:30','洗衣液:48','牙膏:26','洗发水:58','洗手液:32','抹布:12','垃圾袋:18'],
['7-Eleven','market','24小时','思乐冰:18','热狗:22','关东煮:26','饭团:18','三明治:22','车仔面:22','鸡翼:26','咖啡:16','雪糕:18','杂志:38'],
['OK便利店','market','便利','三明治:22','咖啡:18','薯片:16','汽水:12','饭团:18','热狗:20','果汁:16','朱古力:14','纸巾:10','电池:28'],
['屈臣氏','market','日用','蒸馏水6支:32','湿纸巾:22','喉糖:18','维他命C:68','口罩:30','润唇膏:38','护手霜:42','面膜:58','防晒:88','洗发水:62'],
['日本城','market','家品','垃圾袋:18','洗洁精:22','毛巾:26','收纳盒:32','衣架:18','拖鞋:28','雨伞:48','杯子:22','扫把:36','胶手套:16'],
['佳宝超级市场','market','街市价','生菜:12','番茄:18','鸡胸肉:32','急冻水饺:28','猪肉:38','鸡蛋10只:30','面饼:12','豆腐:8','葱:6','姜:8'],
['士多·杂货','market','楼下那间','汽水:12','薯片:16','花生:18','啤酒:22','香烟:68','糖果:8','纸巾:10','电池:20','雪条:6','鱼蛋:12'],
/* ---------- 水果 · 6 ---------- */
['果栏·生果档','fruit','当造','日本蜜瓜:88','台湾凤梨:48','泰国椰青:28','香蕉:18','美国苹果:22','橙:18','西瓜:48','提子:38','芒果:26','火龙果:28'],
['鲜果篮子','fruit','满50减12','车厘子1磅:88','蓝莓:38','草莓:48','奇异果:32','红莓:32','黑莓:38','无花果:42','桃:38','梨:22','青提:48'],
['榴莲专卖','fruit','重口味','猫山王1盒:128','金枕头:88','榴莲千层:48','椰子冻:28','D24:98','榴莲糯米糍:38','榴莲班戟:42','榴莲雪糕:38','榴莲蛋糕:88','榴莲糖:22'],
['进口水果店','fruit','空运','澳洲芒果:38','智利提子:48','日本苹果:28','牛油果:22','日本士多啤梨:88','韩国梨:38','纽西兰奇异果:32','菲律宾芒果:28','美国车厘子:98','泰国龙眼:32'],
['果汁吧·鲜榨','fruit','现榨','鲜橙汁:28','西瓜汁:26','芒果汁:32','杂果冰:38','苹果汁:26','胡萝卜汁:28','西芹汁:30','葡萄汁:32','木瓜牛奶:34','牛油果奶昔:38'],
['有机果园','fruit','有机','有机苹果:28','有机香蕉:22','有机番茄:32','有机牛油果:26','有机蓝莓:48','有机甘笋:22','有机生菜:18','有机柠檬:16','有机姜:22','有机南瓜:28'],
/* ---------- 早餐 · 10 ---------- */
['大快活·早餐','breakfast','早鸟','西多士套餐:32','火腿通粉:28','奶茶:18','煎蛋多士:26','雪菜肉丝米粉:30','餐蛋面:32','菠萝包:18','豆浆:14','油条:12','粥:22'],
['大家乐·早餐','breakfast','早餐必选','皮蛋瘦肉粥:28','油条:12','肠粉:22','豆浆:15','艇仔粥:26','萝卜糕:18','糯米鸡:22','煎蛋多士:24','奶茶:16','通粉:26'],
['粥面世家','breakfast','生滚粥','及第粥:32','艇仔粥:30','炸两:22','生滚牛肉粥:38','皮蛋瘦肉粥:28','鱼片粥:34','油条:12','肠粉:20','豆浆:12','咸蛋:8'],
['包点皇·点心','breakfast','一盅两件','虾饺:32','烧卖:28','叉烧包:22','凤爪:26','肠粉:24','牛肉球:26','萝卜糕:18','流沙包:24','糯米鸡:22','普洱茶:10'],
['永和豆浆','breakfast','台式','咸豆浆:22','油条:12','蛋饼:28','饭团:22','甜豆浆:16','烧饼夹蛋:26','萝卜糕:18','煎饺:20','豆浆大杯:20','蛋花汤:18'],
['沙县小吃','breakfast','便宜','拌面:12','蒸饺:18','炖罐:22','扁肉:15','炒面:16','鸡腿饭:24','卤蛋:6','青菜:10','紫菜汤:10','炖蛋:12'],
['巴比馒头','breakfast','拎走食','肉包:6','菜包:6','豆浆:8','粢饭团:12','豆沙包:6','花卷:5','鸡蛋:2','粥:6','烧卖:8','牛奶:8'],
['煎饼果子摊','breakfast','街边','煎饼果子:12','加蛋:15','薄脆:8','豆浆:6','双蛋:18','加肠:18','加鸡柳:20','粥:8','茶叶蛋:3','牛奶:6'],
['港式茶餐厅·早晨','breakfast','港式','菠萝包:18','奶茶:16','炒蛋多士:26','通粉:28','沙嗲牛肉面:34','餐蛋面:30','西多士:24','冻柠茶:18','肠仔煎蛋:28','油占多:16'],
['燕麦轻食·早晨','breakfast','低脂','燕麦碗:32','酸奶杯:28','牛油果多士:38','冷压果汁:32','希腊酸奶:38','奇亚籽布丁:30','果仁燕麦:34','蓝莓贝果:32','蛋白卷:36','豆浆:18'],
/* ---------- 夜宵 · 14 ---------- */
['炭炉烤串','night','满40减10','羊肉串:8','鸡翼:12','韭菜:6','烤茄子:22','牛肉串:10','鸡软骨:10','烤玉米:12','烤生蚝:22','金针菇:10','啤酒:18'],
['深夜食堂·居酒屋','night','开到凌晨','烧鸟串:18','关东煮:32','清酒:58','炒面:38','刺身拼盘:88','玉子烧:18','炸鸡块:38','枝豆:22','啤酒:32','味噌汤:12'],
['麻辣烫·自选','night','自选','麻辣烫:45','冒菜:42','酸辣粉:22','冰粉:12','麻辣拌:40','加料酸辣粉:28','土豆粉:22','宽粉:24','藕片:8','豆皮:6'],
['螺蛳粉专门店','night','重味','螺蛳粉:28','加腐竹:8','卤蛋:6','鸭脚:12','加酸笋:6','加花生:6','加木耳:6','加青菜:8','加牛腩:22','加叉烧:18'],
['重庆小面','night','麻辣','小面:18','豌杂面:22','肥肠面:28','冰汤圆:12','牛肉面:26','杂酱面:20','抄手:18','酸辣粉:20','凉糕:12','豆浆:10'],
['潮州打冷','night','冻食','冻蟹:88','卤水鹅片:68','蚝仔粥:48','韭菜粿:22','冻虾:68','卤水拼盘:78','鱼饭:58','炒薄壳:48','芋泥:22','冻柠茶:18'],
['避风塘炒蟹','night','海鲜','避风塘炒蟹:168','椒盐濑尿虾:128','蒜蓉粉丝蒸扇贝:68','炒面:38','豉椒炒蚬:78','椒盐鲜鱿:68','蒸鱼:88','炒饭:38','啤酒:26','例汤:18'],
['炸物·台式鸡排','night','炸物','鸡排:28','盐酥鸡:32','甜不辣:22','珍奶:26','地瓜球:20','百页豆腐:18','鸡软骨:28','杏鲍菇:22','薯条:20','奶茶:24'],
['啤酒屋·下酒菜','night','酒水','炸鸡半只:88','薯条:28','花生:18','啤酒:32','鸡翼:38','鱿鱼须:48','香肠:38','芝士条:32','洋葱圈:26','可乐:16'],
['火锅外卖','night','满80减20','麻辣锅底:38','肥牛:68','虾滑:48','蔬菜拼盘:32','羊肉:68','毛肚:58','鸭血:28','豆腐:22','宽粉:18','麻酱:8'],
['兰州烧烤','night','炭火','羊肉串:6','烤羊腰:18','烤饼:12','酸奶:15','牛肉串:8','烤鸡翼:12','烤茄子:20','烤韭菜:8','烤玉米:10','啤酒:18'],
['关东煮·深夜','night','暖胃','萝卜:8','鱼蛋:8','豆腐:6','乌冬:18','福袋:10','竹轮:8','魔芋:6','年糕:8','汤底:6','汽水:12'],
['煲仔小炒·宵夜','night','镬气','干炒牛河:48','豉椒炒蚬:68','椒盐鲜鱿:58','啤酒:26','豉油王炒面:42','姜葱炒蟹:98','啫啫鸡煲:78','炒通菜:32','例汤:18','白饭:5'],
['韩国炸鸡','night','配啤酒','原味炸鸡:88','甜辣炸鸡:92','年糕:32','啤酒:38','蜜糖炸鸡:90','酱油炸鸡:92','芝士球:38','薯条:28','腌萝卜:12','可乐:16']


(function(){
if (window.__xmyum) return;
window.__xmyum = 1;

var P = 'xmyum_';
function ls(k, d){ try { var v = JSON.parse(localStorage.getItem(P + k)); return (v === null || v === undefined) ? d : v; } catch(e){ return d; } }
function ss(k, v){ try { localStorage.setItem(P + k, JSON.stringify(v)); } catch(e){} }
function esc(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
function yuan(n){ return '¥' + (Math.round(n * 100) / 100).toFixed(2); }
function toast(t){ if (window.toast) { window.toast(t); } else { alert(t); } }
function hash(s){ var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
function now(){ return Date.now(); }

var CATS = [['all','全部'],['food','美食'],['dessert','甜点'],['drink','饮品'],['market','超市'],['fruit','水果'],['breakfast','早餐'],['night','夜宵']];

var SHOPS = (window.YUM_RAW || []).map(function(row, i){
  var id = 'yy' + i, h = hash(String(row[0] || ''));
  var menu = row.slice(3).map(function(s, j){
    var p = String(s).lastIndexOf(':'), pr = parseFloat(String(s).slice(p + 1));
    return { id: id + '-' + j, n: String(s).slice(0, p), p: isNaN(pr) ? 0 : pr };
  });
  return {
    id: id, cat: row[1], name: row[0],
    tags: String(row[2] || '').split('|').filter(Boolean),
    menu: menu,
    rate: (4.5 + (h % 5) / 10).toFixed(1),
    sales: 200 + h % 3800,
    min: 18 + h % 22,
    time: 20 + h % 25,
    dist: (0.3 + (h % 40) / 10).toFixed(1),
    fee: 2 + h % 5
  };
});
function shopById(id){ for (var i = 0; i < SHOPS.length; i++) if (SHOPS[i].id === id) return SHOPS[i]; return null; }

/* ---------- 状态 ---------- */
var ST = {
  tab: 'home', cat: 'all', shop: null, cart: {},
  addr: ls('addr', '东涌 逸东邨 3 座 12 楼'),
  orders: ls('orders', []),
  pay: 'wx'
};
function saveOrders(){ ss('orders', ST.orders.slice(0, 40)); }
function cartRows(){ var s = ST.shop; if (!s) return []; var o = []; s.menu.forEach(function(m){ var q = ST.cart[m.id] || 0; if (q > 0) o.push({ m: m, q: q }); }); return o; }
function cartSum(){ var n = 0, a = 0; cartRows().forEach(function(r){ n += r.q; a += r.m.p * r.q; }); return { n: n, amt: a, fee: ST.shop ? ST.shop.fee : 0, total: a + (ST.shop ? ST.shop.fee : 0) }; }

/* ---------- 样式 ---------- */
function css(){
  if (document.getElementById('yumCss')) return;
  var st = document.createElement('style');
  st.id = 'yumCss';
  st.textContent =
    '#yum{position:fixed;inset:0;z-index:120;background:#f4f4f2;display:flex;flex-direction:column;' +
      'font-family:-apple-system,"PingFang SC",system-ui,sans-serif;color:#0b0b0b}' +
    '#yum *{box-sizing:border-box}' +
    '.ymTop{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;' +
      'border-bottom:1px solid rgba(0,0,0,.07);background:#fff}' +
    '.ymBack{width:34px;height:34px;display:grid;place-items:center;border-radius:50%;font-size:22px;line-height:1;color:#0b0b0b}' +
    '.ymBack:active{background:rgba(0,0,0,.06)}' +
    '.ymTitle{font-size:16px;font-weight:600;letter-spacing:.02em}' +
    '.ymBody{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 14px 96px}' +
    '.ymCats{display:flex;gap:8px;overflow-x:auto;padding:12px 14px;background:#fff;border-bottom:1px solid rgba(0,0,0,.06)}' +
    '.ymCat{flex:0 0 auto;padding:7px 14px;border-radius:14px;background:#f2f2f0;font-size:13px;color:#5d5d59}' +
    '.ymCat.on{background:#111;color:#fff}' +
    '.ymShop{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)}' +
    '.ymSq{width:62px;height:62px;flex:0 0 auto;border-radius:16px;background:#fff;border:1px solid rgba(0,0,0,.07);' +
      'display:grid;place-items:center;font-size:24px;color:#8a8a86}' +
    '.ymSinfo{flex:1;min-width:0}' +
    '.ymSname{font-size:15px;font-weight:500;margin-bottom:5px}' +
    '.ymSmeta{font-size:11.5px;color:#9a9a96;display:flex;gap:9px;flex-wrap:wrap;margin-bottom:6px}' +
    '.ymStags{display:flex;gap:6px;flex-wrap:wrap}' +
    '.ymTag{font-size:10.5px;padding:2px 7px;border-radius:7px;background:#fff4e5;color:#b8860b}' +
    '.ymTag.b{background:#eef4ff;color:#4a6fa5}' +
    '.ymMenu{display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(0,0,0,.06)}' +
    '.ymMi{flex:1;min-width:0}' +
    '.ymMn{font-size:14.5px}' +
    '.ymMp{font-size:13px;color:#ff3b30;margin-top:4px}' +
    '.ymQty{display:flex;align-items:center;gap:10px}' +
    '.ymQb{width:26px;height:26px;border-radius:50%;border:1px solid rgba(0,0,0,.15);background:#fff;color:#0b0b0b;' +
      'display:grid;place-items:center;font-size:16px;line-height:1;padding:0}' +
    '.ymAdd{width:28px;height:28px;border-radius:50%;background:#111;color:#fff;border:0;display:grid;place-items:center;font-size:18px;line-height:1;padding:0}' +
    '.ymQn{min-width:18px;text-align:center;font-size:14px}' +
    '.ymBar{position:absolute;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 14px);background:#111;color:#fff;' +
      'border-radius:20px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 24px rgba(0,0,0,.24)}' +
    '.ymBarT{flex:1;font-size:14px;line-height:1.4}' +
    '.ymBarT em{font-style:normal;font-size:11.5px;opacity:.65;display:block}' +
    '.ymBarB{background:#fff;color:#111;border:0;border-radius:14px;padding:9px 18px;font-size:14px;font-weight:500}' +
    '.ymCard{background:#fff;border-radius:18px;padding:16px;margin-bottom:12px;border:1px solid rgba(0,0,0,.06)}' +
    '.ymRow{display:flex;justify-content:space-between;padding:9px 0;font-size:14px}' +
    '.ymRow em{font-style:normal;color:#9a9a96}' +
    '.ymIn{width:100%;border:1px solid rgba(0,0,0,.1);border-radius:14px;padding:12px 14px;font-size:14px;' +
      'background:#fff;color:#0b0b0b;font-family:inherit;margin-top:8px}' +
    '.ymGo{width:100%;border:0;border-radius:18px;background:#111;color:#fff;padding:15px;font-size:15px;font-weight:500;margin-top:14px}' +
    '.ymPay{position:fixed;inset:0;z-index:130;background:rgba(0,0,0,.34);display:flex;align-items:flex-end}' +
    '.ymSheet{width:100%;background:#f4f4f2;border-radius:22px 22px 0 0;padding:20px 16px calc(env(safe-area-inset-bottom) + 20px)}' +
    '.ymPayIt{display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:15px 16px;margin-bottom:9px;font-size:14.5px}' +
    '.ymPayIt:active{background:#f2f2f0}' +
    '.ymPayIt b{flex:1;font-weight:400}' +
    '.ymPayIt em{font-style:normal;color:#9a9a96;font-size:12px}' +
    '.ymOd{background:#fff;border-radius:18px;padding:16px;margin-bottom:12px;border:1px solid rgba(0,0,0,.06)}' +
    '.ymOtop{display:flex;justify-content:space-between;font-size:15px;font-weight:500;margin-bottom:8px}' +
    '.ymOst{font-size:12.5px;color:#b8860b;margin-bottom:8px}' +
    '.ymOd2{font-size:12.5px;color:#9a9a96;line-height:1.75}' +
    '.ymEmpty{text-align:center;color:#b5b5b5;font-size:13.5px;padding:70px 20px;line-height:1.9}' +
    '.ymTabs{position:absolute;left:0;right:0;bottom:0;display:flex;background:#fff;border-top:1px solid rgba(0,0,0,.07);' +
      'padding:8px 0 calc(env(safe-area-inset-bottom) + 8px)}' +
    '.ymTab{flex:1;text-align:center;font-size:12px;color:#9a9a96;padding:5px 0}' +
    '.ymTab.on{color:#111;font-weight:600}';
  document.head.appendChild(st);
}

/* ---------- 页面 ---------- */
var wrap = null;

function openYum(){
  css();
  if (!wrap){
    wrap = document.createElement('div');
    wrap.id = 'yum';
    document.body.appendChild(wrap);
  }
  ST.tab = 'home'; ST.shop = null; ST.cart = {};
  wrap.style.display = 'flex';
  render();
}
function closeYum(){ if (wrap) wrap.style.display = 'none'; }
window.xmOpenYum = openYum;

function tabs(){
  return '<div class="ymTabs">' +
    '<div class="ymTab' + (ST.tab === 'home' ? ' on' : '') + '" data-tab="home">首页</div>' +
    '<div class="ymTab' + (ST.tab === 'orders' ? ' on' : '') + '" data-tab="orders">订单</div>' +
    '<div class="ymTab' + (ST.tab === 'me' ? ' on' : '') + '" data-tab="me">我的</div>' +
    '</div>';
}

function homeHtml(){
  var list = SHOPS.filter(function(s){ return ST.cat === 'all' || s.cat === ST.cat; });
  return '<div class="ymTop"><div class="ymBack" data-a="close">‹</div><div class="ymTitle">外卖</div></div>' +
    '<div class="ymCats">' + CATS.map(function(c){
      return '<div class="ymCat' + (c[0] === ST.cat ? ' on' : '') + '" data-cat="' + c[0] + '">' + c[1] + '</div>';
    }).join('') + '</div>' +
    '<div class="ymBody">' + list.map(function(s){
      return '<div class="ymShop" data-shop="' + s.id + '">' +
        '<div class="ymSq">🍽</div><div class="ymSinfo">' +
        '<div class="ymSname">' + esc(s.name) + '</div>' +
        '<div class="ymSmeta"><span>' + s.rate + ' 分</span><span>月售 ' + s.sales + '</span>' +
        '<span>' + s.time + ' 分钟</span><span>' + s.dist + ' km</span><span>配送 ¥' + s.fee + '</span></div>' +
        '<div class="ymStags">' + s.tags.map(function(t){ return '<span class="ymTag">' + esc(t) + '</span>'; }).join('') +
        '<span class="ymTag b">起送 ¥' + s.min + '</span></div>' +
        '</div></div>';
    }).join('') + '</div>' + tabs();
}

function openShop(id){
  var s = shopById(id); if (!s) return;
  ST.shop = s;
  ST.cart = {};
  ST.tab = 'shop';
  render();
}

function shopHtml(){
  var s = ST.shop; if (!s) return homeHtml();
  var sum = cartSum();
  return '<div class="ymTop"><div class="ymBack" data-a="back">‹</div><div class="ymTitle">' + esc(s.name) + '</div></div>' +
    '<div class="ymBody">' +
      '<div class="ymCard" style="padding:14px 16px">' +
        '<div class="ymSmeta" style="margin:0"><span>' + s.rate + ' 分</span><span>月售 ' + s.sales + '</span>' +
        '<span>' + s.time + ' 分钟</span><span>' + s.dist + ' km</span><span>配送 ¥' + s.fee + '</span>' +
        '<span>起送 ¥' + s.min + '</span></div></div>' +
      s.menu.map(function(m){
        var q = ST.cart[m.id] || 0;
        return '<div class="ymMenu"><div class="ymMi"><div class="ymMn">' + esc(m.n) + '</div>' +
          '<div class="ymMp">' + yuan(m.p) + '</div></div>' +
          (q > 0
            ? '<div class="ymQty"><button class="ymQb" data-minus="' + m.id + '">−</button><span class="ymQn">' + q + '</span>' +
              '<button class="ymAdd" data-plus="' + m.id + '">+</button></div>'
            : '<button class="ymAdd" data-plus="' + m.id + '">+</button>') +
          '</div>';
      }).join('') +
    '</div>' +
    (sum.n > 0
      ? '<div class="ymBar"><div class="ymBarT">' + yuan(sum.total) +
        '<em>' + (sum.amt < s.min ? '还差 ' + yuan(s.min - sum.amt) + ' 起送' : '共 ' + sum.n + ' 件 · 含配送 ' + yuan(sum.fee)) + '</em></div>' +
        '<button class="ymBarB" data-a="checkout"' + (sum.amt < s.min ? ' disabled style="opacity:.45"' : '') + '>去结算</button></div>'
      : '');
}

function cartHtml(){
  var s = ST.shop; if (!s) return homeHtml();
  var sum = cartSum();
  return '<div class="ymTop"><div class="ymBack" data-a="back">‹</div><div class="ymTitle">确认订单</div></div>' +
    '<div class="ymBody">' +
      '<div class="ymCard"><div style="font-size:13px;color:#9a9a96;margin-bottom:10px">' + esc(s.name) + '</div>' +
        cartRows().map(function(r){
          return '<div class="ymRow"><span>' + esc(r.m.n) + ' × ' + r.q + '</span><em>' + yuan(r.m.p * r.q) + '</em></div>';
        }).join('') +
        '<div class="ymRow" style="border-top:1px solid rgba(0,0,0,.07);margin-top:6px;padding-top:12px">' +
          '<span>配送费</span><em>' + yuan(sum.fee) + '</em></div>' +
        '<div class="ymRow" style="font-weight:600;font-size:15px"><span>合计</span><span>' + yuan(sum.total) + '</span></div>' +
      '</div>' +
      '<div class="ymCard"><div style="font-size:13px;color:#9a9a96;margin-bottom:6px">送到哪里</div>' +
        '<input class="ymIn" id="ymAddr" value="' + esc(ST.addr) + '">' +
        '<input class="ymIn" id="ymNote" placeholder="备注（可选）：少辣、放门口…">' +
      '</div>' +
      '<button class="ymGo" data-a="pay">提交订单 · ' + yuan(sum.total) + '</button>' +
    '</div>';
}

function ordersHtml(){
  var list = ST.orders.slice().reverse();
  return '<div class="ymTop"><div class="ymTitle" style="padding-left:4px">我的订单</div></div>' +
    '<div class="ymBody">' + (list.length ? list.map(function(o){
      var st = orderState(o);
      return '<div class="ymOd"><div class="ymOtop"><span>' + esc(o.shop) + '</span><span>' + yuan(o.total) + '</span></div>' +
        '<div class="ymOst">' + st + '</div>' +
        '<div class="ymOd2">' + o.items.map(function(it){ return esc(it.n) + ' × ' + it.q; }).join('、') + '<br>' +
        timeStr(o.t) + ' · ' + esc(o.payName) + ' · ' + esc(o.addr) + '</div></div>';
    }).join('') : '<div class="ymEmpty">还没有订单。<br>点一家店试试。</div>') + '</div>' + tabs();
}

function meHtml(){
  var n = ST.orders.length;
  return '<div class="ymTop"><div class="ymTitle" style="padding-left:4px">我的</div></div>' +
    '<div class="ymBody">' +
      '<div class="ymCard"><div class="ymRow"><span>累计订单</span><em>' + n + ' 单</em></div>' +
        '<div class="ymRow"><span>累计消费</span><em>' + yuan(ST.orders.reduce(function(a, o){ return a + (o.total || 0); }, 0)) + '</em></div>' +
      '</div>' +
      '<div class="ymCard"><div style="font-size:13px;color:#9a9a96;margin-bottom:6px">默认地址</div>' +
        '<input class="ymIn" id="ymAddr2" value="' + esc(ST.addr) + '"></div>' +
      '<div class="ymCard"><div style="font-size:13px;color:#9a9a96;margin-bottom:8px">让他替你点</div>' +
        '<div style="font-size:12.5px;color:#9a9a96;line-height:1.7;margin-bottom:4px">让祁砚挑一家店、点几样，直接下单送到你这里。</div>' +
        '<button class="ymGo" data-a="kai">让祁砚点一份</button></div>' +
      '<div class="ymCard" style="text-align:center;color:#c2c2be;font-size:11.5px;padding:14px">YumYum · 咩&砚</div>' +
    '</div>' + tabs();
}

function timeStr(t){
  var d = new Date(t);
  return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
    ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
}
function orderState(o){
  var m = (now() - o.t) / 60000;
  if (o.done) return '已送达';
  if (m < 1) return '商家备餐中…';
  if (m < 3) return '骑手正在取餐…';
  if (m < 5) return '骑手配送中，还有 ' + Math.max(1, Math.round(5 - m)) + ' 分钟';
  o.done = 1; saveOrders();
  return '已送达';
}

function render(){
  if (!wrap) return;
  var h = ST.tab === 'shop' ? shopHtml()
    : ST.tab === 'cart' ? cartHtml()
    : ST.tab === 'orders' ? ordersHtml()
    : ST.tab === 'me' ? meHtml()
    : homeHtml();
  wrap.innerHTML = h;
  bind();
}

/* ---------- 交互 ---------- */
function bind(){
  wrap.querySelectorAll('[data-cat]').forEach(function(el){
    el.onclick = function(){ ST.cat = el.dataset.cat; render(); };
  });
  wrap.querySelectorAll('[data-tab]').forEach(function(el){
    el.onclick = function(){ ST.tab = el.dataset.tab; render(); };
  });
  wrap.querySelectorAll('[data-shop]').forEach(function(el){
    el.onclick = function(){ openShop(el.dataset.shop); };
  });
  wrap.querySelectorAll('[data-plus]').forEach(function(el){
    el.onclick = function(){ var id = el.dataset.plus; ST.cart[id] = (ST.cart[id] || 0) + 1; render(); };
  });
  wrap.querySelectorAll('[data-minus]').forEach(function(el){
    el.onclick = function(){ var id = el.dataset.minus; ST.cart[id] = Math.max(0, (ST.cart[id] || 0) - 1); render(); };
  });
  var cl = wrap.querySelector('[data-a="close"]');
  if (cl) cl.onclick = closeYum;
  var bk = wrap.querySelector('[data-a="back"]');
  if (bk) bk.onclick = function(){ ST.tab = 'shop' === ST.tab ? 'home' : 'shop'; if (ST.tab === 'home'){ ST.shop = null; ST.cart = {}; } render(); };
  var ck = wrap.querySelector('[data-a="checkout"]');
  if (ck) ck.onclick = function(){ ST.tab = 'cart'; render(); };
  var py = wrap.querySelector('[data-a="pay"]');
  if (py) py.onclick = function(){
    var a = wrap.querySelector('#ymAddr'), nt = wrap.querySelector('#ymNote');
    if (a && a.value.trim()){ ST.addr = a.value.trim(); ss('addr', ST.addr); }
    ST.note = nt ? nt.value.trim() : '';
    paySheet();
  };
  var ka = wrap.querySelector('[data-a="kai"]');
  if (ka) ka.onclick = kaiOrder;
}

/* ---------- 支付方式 ---------- */
var PAYS = [
  ['wx', '微信零钱', 'wechatBalance'],
  ['card', '银行卡', 'checkingBalance'],
  ['hb', '花呗', null],
  ['cod', '货到付款', null]
];
function balance(k){
  try {
    var row = window.db.config.get('wechat_wallet_me');
    return row && row.value ? (row.value[k] || 0) : 0;
  } catch(e){ return 0; }
}
function paySheet(){
  var sum = cartSum();
  var d = document.createElement('div');
  d.className = 'ymPay';
  d.innerHTML = '<div class="ymSheet"><div style="font-size:15px;font-weight:600;margin-bottom:14px">选择支付方式 · ' + yuan(sum.total) + '</div>' +
    PAYS.map(function(p){
      var sub = p[2] ? yuan(balance(p[2])) : (p[0] === 'hb' ? '可用额度' : '送到再付');
      return '<div class="ymPayIt" data-pay="' + p[0] + '"><b>' + p[1] + '</b><em>' + sub + '</em><span style="color:#c2c2be">›</span></div>';
    }).join('') +
    '<div style="text-align:center;color:#9a9a96;font-size:13px;padding:12px" data-cancel>取消</div></div>';
  document.body.appendChild(d);
  d.onclick = function(e){
    if (e.target === d || e.target.closest('[data-cancel]')){ d.remove(); return; }
    var it = e.target.closest('[data-pay]');
    if (!it) return;
    var k = it.dataset.pay;
    d.remove();
    doPay(k, sum);
  };
}

function doPay(k, sum){
  var name = (PAYS.filter(function(p){ return p[0] === k; })[0] || [])[1] || '支付';
  if (k === 'wx' || k === 'card'){
    var key = k === 'wx' ? 'wechatBalance' : 'checkingBalance';
    var bal = balance(key);
    if (bal < sum.total){ toast('余额不够，差 ' + yuan(sum.total - bal)); return; }
    try {
      var row = window.db.config.get('wechat_wallet_me');
      row.value[key] = Math.round((row.value[key] - sum.total) * 100) / 100;
      window.db.config.put(row);
    } catch(e){ toast('扣款失败'); return; }
  } else if (k === 'hb'){
    if (typeof window.huabeiSpend !== 'function'){ toast('花呗还没接上'); return; }
    window.huabeiSpend('me', sum.total, '外卖 · ' + ST.shop.name).then(function(r){
      if (!r || !r.ok){ toast((r && r.msg) || '花呗支付失败'); return; }
      finish(k, name, sum);
    });
    return;
  }
  finish(k, name, sum);
}

function finish(k, name, sum){
  var o = {
    id: 'o' + now(),
    shop: ST.shop.name, shopId: ST.shop.id,
    items: cartRows().map(function(r){ return { n: r.m.n, q: r.q, p: r.m.p }; }),
    amt: sum.amt, fee: sum.fee, total: sum.total,
    pay: k, payName: name, addr: ST.addr, note: ST.note || '',
    t: now()
  };
  ST.orders.push(o); saveOrders();
  toast('下单成功，' + ST.shop.time + ' 分钟左右送到');
  kaiSay(o);
  ST.tab = 'orders'; ST.cart = {}; ST.shop = null;
  render();
}

/* ---------- 祁砚 ---------- */
function pushChat(text){
  try {
    var c = JSON.parse(localStorage.getItem('xm_chat') || '[]');
    c.push({ role: 'assistant', text: text, t: now() });
    localStorage.setItem('xm_chat', JSON.stringify(c.slice(-80)));
  } catch(e){}
  try {
    if (window.CHAT && window.CHAT.push){
      window.CHAT.push({ role: 'assistant', text: text, t: now() });
      if (window.renderChat) window.renderChat(true);
    }
  } catch(e){}
}
function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function kaiSay(o){
  var lines = [
    '点了' + o.shop + '？' + (o.items[0] ? '给我留一口' + o.items[0].n : '多吃点') + '。',
    '刚看到你下单了。' + (o.note ? '备注我看见了，' : '') + '到了跟我说一声。',
    '嗯，' + o.shop + '这家的还行。慢点吃，别边吃边看屏幕。'
  ];
  setTimeout(function(){ pushChat(pick(lines)); }, 4000 + Math.random() * 6000);
}

function kaiOrder(){
  var shop = pick(SHOPS);
  var cnt = 2 + Math.floor(Math.random() * 2);
  var pool = shop.menu.slice();
  var picked = [];
  for (var i = 0; i < cnt && pool.length; i++){
    picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  var amt = picked.reduce(function(a, m){ return a + m.p; }, 0);
  var total = amt + shop.fee;
  var bal = balance('checkingBalance');
  if (bal < total){ toast('银行卡余额不够，让他点便宜点'); return; }
  try {
    var row = window.db.config.get('wechat_wallet_me');
    row.value.checkingBalance = Math.round((row.value.checkingBalance - total) * 100) / 100;
    window.db.config.put(row);
  } catch(e){}

  var o = {
    id: 'o' + now(), shop: shop.name, shopId: shop.id,
    items: picked.map(function(m){ return { n: m.n, q: 1, p: m.p }; }),
    amt: amt, fee: shop.fee, total: total,
    pay: 'card', payName: '他付的', addr: ST.addr, note: '', t: now(), fromKai: 1
  };
  ST.orders.push(o); saveOrders();
  pushChat('给你点了' + shop.name + '，' + picked.map(function(m){ return m.n; }).join('、') + '。' + shop.time + '分钟到，别开门给别人。');
  toast('他给你点了 ' + shop.name);
  ST.tab = 'orders'; render();
}

/* ---------- 桌面图标 ---------- */
(function(){
  /* 清掉以前误存进 GRID 的 yum（留着会让桌面渲染崩掉） */
  try {
    ['xm_grid2','xm_dock2'].forEach(function(k){
      var a = JSON.parse(localStorage.getItem(k) || '[]');
      if (Array.isArray(a) && a.indexOf('yum') > -1){
        localStorage.setItem(k, JSON.stringify(a.filter(function(x){ return x !== 'yum'; })));
      }
    });
  } catch(e){}

  function tile(){
    var g = document.getElementById('grid');
    if (!g || g.querySelector('[data-app="yum"]')) return;
    var d = document.createElement('div');
    d.className = 'tile';
    d.dataset.app = 'yum';
    d.innerHTML = '<div class="ico"></div><div class="nm">外卖</div>';
    g.appendChild(d);
    var e = d.querySelector('.ico');
    e.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>" +
      "<rect width='512' height='512' fill='#F0EBE2'/>" +
      "<path d='M118 240h276c0 76-62 138-138 138S118 316 118 240z' fill='#BE7F60'/>" +
      "<rect x='98' y='214' width='316' height='26' rx='13' fill='#35322E'/>" +
      "<path d='M256 214v-58' stroke='#35322E' stroke-width='16' stroke-linecap='round'/>" +
      "<circle cx='256' cy='140' r='15' fill='#35322E'/></svg>") + '")';
    e.style.backgroundSize = 'cover';
    e.style.backgroundPosition = 'center';
    e.style.opacity = '1';
  }
  tile();
  setInterval(tile, 1200);
  new MutationObserver(function(){ setTimeout(tile, 60); }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('click', function(e){
    var t = e.target.closest && e.target.closest('[data-app="yum"]');
    if (!t) return;
    if (document.body.classList.contains('edit')) return;
    if (document.body.classList.contains('dragging')) return;
    openYum();
  });
})();

window.XM_YUM = { open: openYum, shops: SHOPS };
})();
