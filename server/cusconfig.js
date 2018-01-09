exports.cusconfig = {
    getPeerInterval:30000,      //从tracker get peer 频率 ， 如果返回peer数小于30 ，间隔会加倍
    weedOutPeerInterval:20000,  //淘汰peer的间隔，达到一定连接饱和才会启动此策略
    peerConnectInterval:500,    //最大连接间隔，小于此值 被动连接会拒绝连接，主动不会发起连接
    deadTimeout:10000,          //NAT超时和检测peer死掉时长
    peerConnectMax:15,          //最大主动连接数
    ReadBuffMin:5000,           //最大读取buffer长度(太小影响decoder稳定
    LoadBuffMin:5000,           //最小buffer,包括已解码和未推入decoder两部分 , 如果小于此值 则启动CDN加载
    ChunkMergeLoad:5,           //P2P已经下载chunk一部分,是否等待CDN下载 CHUNk有 onP2P属性
                                //onP2P 取值 -1-10
                                //-1 : 还未从P2P启动下载 或者最后一次P2P推入数据时长超过2秒
                                //0-10 表示 P2P 已经下载 十分比例 1表示10% 一次类推
                                //此属性 影响这部分已经由P2P下载了一部分的chunk,比如 5 表示 chunk下载大于50%并且还在活跃,则不从CDN下载,一直等P2P下载
    delayEx:0,                  //额外延时,可以设置额外延时
    protectTime:5               //保护时间 ,下载可以从最大时间下载,并有保护策略,如果处在保护的几秒内,不会因为错误次数较多,而放弃这个chunk下载
};
