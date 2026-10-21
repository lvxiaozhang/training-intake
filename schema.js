/* ===========================================================
   培训需求问诊单 — 结构定义（v2）
   两份问卷：学校版（被培训方填写）/ 团队版（ClassIn 侧填写）
   字段不以"想了解什么"提问，而以"培训方案必须确定的决策变量"倒推
   =========================================================== */

var SURVEY = {
  title: '培训需求问诊单',
  subtitle: '学校填写',
  version: '2.0',
  sections: [

    /* ---------------- A 您与学校 ---------------- */
    {
      id: 'A',
      title: '您与学校',
      desc: '先确认您是谁、学校是哪一所，以及这所学校目前的真实使用状态。',
      fields: [
        { id: 'name', label: '您的姓名', type: 'text', req: false, ph: '可留空' },
        { id: 'school', label: '学校全称', type: 'text', req: true,
          hint: '请写全称（含校区）。我们要据此准备与贵校学段、生源匹配的案例，写简称容易配错。',
          ph: '例：济南市××学校（××校区）' },
        { id: 'useClassin', label: '贵校是否已经开始使用 ClassIn', type: 'radio', req: true,
          hint: '按贵校当前真实状态选。「签了但没人用」请选「还没开始使用」。这一题决定培训是从零讲起，还是从老师们正在用的界面切进去。',
          opts: [
            ['yes', '已经开始使用'],
            ['part', '部分年级或学科在用'],
            ['no', '还没开始使用'],
            ['unknown', '不清楚']
          ]},
        { id: 'useAic', label: '贵校是否已经开始使用 AIC（课堂分析）', type: 'radio', req: true,
          hint: '指课堂观察与分析报告的实际上线使用，不含只听过介绍、只看过演示。',
          opts: [
            ['yes', '已经开始使用'],
            ['part', '部分年级或学科在用'],
            ['no', '还没开始使用'],
            ['unknown', '不清楚']
          ]},
        { id: 'role', label: '您在学校的分工', type: 'radio', req: true, opts: [
          ['principal', '校长 / 书记'],
          ['vice', '教学（德育）副校长'],
          ['academic', '教务处 / 教研（教科）室主任'],
          ['lead', '教研组长 / 备课组长'],
          ['it', '信息中心主任 / 信息化负责人'],
          ['teacher', '一线教师'],
          ['other', '其他']
        ]},
        { id: 'stand', label: '您与这次培训的关系', type: 'radio', req: false, opts: [
          ['decide', '我负责这次培训的整体安排'],
          ['relay', '我协助收集意见，具体安排由学校确定'],
          ['self', '我先了解情况，供学校参考']
        ], hint: '选哪一项都不影响后续沟通，只决定我们是否还需要跟学校再对齐一次目标。' }
      ]
    },

    /* ---------------- B 学校与本项目 ---------------- */
    {
      id: 'B',
      title: '学校与本项目',
      desc: '同样的工具，在不同办学阶段、不同推动层级里，落地方式完全不同。',
      fields: [
        { id: 'stage', label: '学段', type: 'checkbox', req: true, opts: [
          ['primary', '小学'], ['junior', '初中'], ['senior', '高中'],
          ['combined', '完全中学'], ['nine', '九年一贯'], ['voc', '中职'], ['other', '其他']
        ]},
        { id: 'nature', label: '学校性质', type: 'radio', req: false, opts: [
          ['public', '公办'], ['private', '民办'],
          ['newgroup', '集团化办学的新校区'], ['other', '其他']
        ]},
        { id: 'age', label: '办学年限', type: 'radio', req: false, opts: [
          ['lt1', '不满 1 年'], ['y13', '1–3 年'], ['y310', '3–10 年'], ['gt10', '10 年以上']
        ]},
        { id: 'classCount', label: '班级数', type: 'number', req: false, unit: '个', half: true },
        { id: 'teacherCount', label: '专任教师数', type: 'number', req: false, unit: '人', half: true },
        { id: 'driver', label: '这项培训由谁推动', type: 'radio', req: true, opts: [
          ['group', '集团层面部署'],
          ['principal', '校长室 / 校领导'],
          ['academic', '教务处或教研组'],
          ['teacher', '一线教师自发申请'],
          ['vendor', 'ClassIn 推动，学校配合']
        ], hint: '推动层级越高，我们越可以在培训里直接安排制度性动作；只由供方推动的，重心要放在让老师当场尝到甜头。' },
        { id: 'priority', label: '这件事目前在学校的位置', type: 'radio', req: false, opts: [
          ['key', '本学期重点工作'], ['normal', '常规教研安排之一'],
          ['pilot', '小范围试点探索'], ['watch', '暂时只是了解、看看']
        ]}
      ]
    },

    /* ---------------- C 采购与使用现状 ---------------- */
    {
      id: 'C',
      title: 'ClassIn / AIC 的采购与使用现状',
      desc: '买了没有、买到哪一步、谁在用。这一段决定当天能不能用贵校自己的数据做演示。',
      fields: [
        { id: 'procure', label: '学校目前是否已经采购 / 部署 ClassIn 或 AIC', type: 'radio', req: true,
          hint: '请选最接近实际的一项。签约与部署是两件事，请按当前真实状态选。',
          opts: [
            ['running', '已采购，已部署并开通使用'],
            ['signed', '已签约，尚未部署或正在部署'],
            ['trial', '正在试用（试用期 / 试点班级）'],
            ['none', '尚未采购，这次是第一次接触'],
            ['unknown', '不清楚采购情况']
          ]},
        { id: 'deployed', label: '具体已经用上的是哪些', type: 'checkbox', req: false,
          hint: '可多选。用于区分"只买了平台"还是"课堂分析也在用"。',
          opts: [
            ['classin', 'ClassIn 教学平台（备课 / 授课）'],
            ['aic', 'AIC 课堂分析（课堂观察 / 报告）'],
            ['hw', 'AI 录播 / 智慧教室硬件'],
            ['other', '其他课堂观察或听评课系统'],
            ['none', '都还没实际用上']
          ]},
        { id: 'deployedTime', label: '部署 / 开通至今多久', type: 'radio', req: false, opts: [
          ['na', '还没部署'], ['m1', '1 个月内'], ['m13', '1–3 个月'],
          ['m36', '3–6 个月'], ['m6', '半年以上']
        ]},
        { id: 'coverage', label: '目前的覆盖范围', type: 'text', req: false,
          hint: '设备装在哪里、账号开给了谁。', ph: '例：3 间教室 / 八年级数学、英语 / 全校教师账号已开' },
        { id: 'freq', label: '目前实际使用频率', type: 'radio', req: true, opts: [
          ['none', '基本没用起来'],
          ['few', '少数教师偶尔用'],
          ['some', '部分教研组每月会用'],
          ['most', '多数教师每周会用'],
          ['daily', '已经成为日常']
        ], hint: '请按真实情况填。填得保守，我们才能把时间花在真问题上。' },
        { id: 'users', label: '现在主要在用的人是谁', type: 'radio', req: false, opts: [
          ['star', '1–3 位骨干教师'], ['group', '部分教研组'],
          ['most', '多数教师'], ['all', '全体教师']
        ]},
        { id: 'barriers', label: '用不起来，最主要卡在哪', type: 'checkbox', req: true, max: 3,
          hint: '最多选 3 项，请按影响从大到小点选。这一题直接决定培训的主线。',
          opts: [
            ['skill', '不会操作，也没人教'],
            ['read', '会操作，但看不懂、不会解读报告'],
            ['act', '看得懂报告，但不知道怎么改课'],
            ['load', '增加工作量、太费时间'],
            ['tech', '设备和网络不稳定'],
            ['apart', '跟现有教研流程融不进去，两张皮'],
            ['noreq', '学校没有明确要求，用不用一个样'],
            ['fear', '部分教师有顾虑（怕被监控、怕被比较）'],
            ['noleader', '缺带头人，没人持续推'],
            ['privacy', '对数据与隐私边界不放心']
          ]},
        { id: 'owner', label: '校内有没有明确的推进负责人', type: 'radio', req: false, opts: [
          ['full', '有专职'], ['part', '有兼职'], ['none', '没有'], ['unknown', '不清楚']
        ], hint: '没有负责人的项目，培训热度通常不超过两周。' },
        { id: 'rules', label: '学校已经有的配套动作', type: 'checkbox', req: false, opts: [
          ['none', '目前没有'], ['freq', '有使用频次要求'],
          ['research', '与教研活动结合'], ['assess', '纳入教师考核或评价'],
          ['reward', '有激励措施'], ['train', '组织过校内培训']
        ]}
      ]
    },

    /* ---------------- D 对 AI 的认识与用法 ---------------- */
    {
      id: 'D',
      title: '对 AI 的认识与用法',
      desc: '同样是「想用 AI」，有人想省时间，有人想看清课堂，也有人是被要求。判断不同，讲法就不同。',
      fields: [
        { id: 'aiFrame', label: '在贵校看来，AI 进课堂首先意味着什么', type: 'radio', req: true,
          hint: '请选最接近贵校主流看法的一项。这一题决定开场第一句往哪走——讲减负、讲专业成长，还是先解疑虑，是三个不同的开头。',
          opts: [
            ['save', '减负工具：先帮老师把时间省下来'],
            ['grow', '专业发展工具：帮老师看清自己这节课'],
            ['judge', '管理工具：用来检查和评价教师'],
            ['student', '关键在学生：教师端不是重点'],
            ['wave', '概念大于实用：先观望'],
            ['unsure', '说不清，各种说法都有']
          ]},
        { id: 'aiPolicy', label: '学校对上级关于 AI 的要求了解到哪一步', type: 'radio', req: false,
          hint: '指教育行政部门关于人工智能进校园、进课堂的文件与规范（含生成式 AI 使用规范、中小学人工智能教育要求）。',
          opts: [
            ['clear', '有明确要求，正在落实'],
            ['heard', '听说过，还没有具体要求'],
            ['none', '没怎么关注'],
            ['unknown', '不清楚']
          ]},
        { id: 'aiUse', label: '老师们现在用 AI 做什么（不限本校购买的工具）', type: 'checkbox', req: true,
          hint: '可多选。这题问的是已经在发生的事，不是学校买了什么——培训最好从他们已经在用的那一件事切进去。',
          opts: [
            ['lesson', '备课 / 写教案'],
            ['quiz', '出题 / 组卷 / 命题'],
            ['slide', '做课件 / 找素材'],
            ['mark', '批改作业 / 写评语'],
            ['paper', '写计划总结、填表、写材料'],
            ['research', '教科研写作 / 论文'],
            ['data', '学生数据与学情分析'],
            ['guide', '指导学生使用 AI（项目、作业）'],
            ['none', '基本没用过'],
            ['unknown', '不清楚']
          ]}
      ]
    },

    /* ---------------- E 期望 ---------------- */
    {
      id: 'E',
      title: '这次培训要什么',
      desc: '一场培训只能有一个主目标。写三个，等于没有目标。',
      fields: [
        { id: 'oneThing', label: '如果这次培训只能解决一个问题，您希望是哪一个', type: 'textarea', req: true,
          hint: '一句话就够，越具体越好。不要写"提升教师信息化素养"这类无法验证的话。',
          ph: '例：让八年级数学组 12 位老师知道怎么用 AIC 报告改一节复习课', maxlen: 80 },
        { id: 'endAction', label: '培训结束时，您希望参训老师能做到哪一步', type: 'radio', req: true,
          hint: '请只选一个。这是目标标定题——它决定我们敢不敢做实操、要不要分组。',
          opts: [
            ['aware', '知道 AIC 是什么、产生兴趣就行'],
            ['run', '能独立完成一次完整分析、拿到报告'],
            ['read', '能读懂一份报告，说出关键结论'],
            ['fix', '能基于报告指出自己课堂的一处可改进点'],
            ['design', '能设计并上一节用上 AIC 的课'],
            ['spread', '能在教研组里带动同伴一起用']
          ]},
        { id: 'phase', label: '这次培训在推进路径上的位置', type: 'radio', req: false, opts: [
          ['start', '首次启动'], ['deepen', '试点深化'],
          ['scale', '全面推广'], ['redo', '复训纠偏'], ['unsure', '说不清']
        ]},
        { id: 'leaderExpect', label: '校领导对这次培训的态度', type: 'radio', req: false, opts: [
          ['attend_req', '会全程到场，并现场提要求'],
          ['attend', '会到场'],
          ['verbal', '口头重视，但不一定到场'],
          ['clear', '暂未明确'],
          ['kpi', '明确要与考核挂钩']
        ]}
      ]
    },

    /* ---------------- F 参训的人 ---------------- */
    {
      id: 'F',
      title: '坐在下面的人',
      desc: '同一套内容，给骨干讲和给全员讲，是两场完全不同的培训。',
      fields: [
        { id: 'headcount', label: '预计参训人数', type: 'number', req: true, unit: '人',
          hint: '请填一个相对确定的数字。人数翻倍会直接改变组织形式。' },
        { id: 'nTeacher', label: '其中一线教师', type: 'number', req: false, unit: '人', half: true },
        { id: 'nGroup', label: '教研组长 / 备课组长', type: 'number', req: false, unit: '人', half: true },
        { id: 'nMid', label: '中层管理', type: 'number', req: false, unit: '人', half: true },
        { id: 'nPrincipal', label: '校领导', type: 'number', req: false, unit: '人', half: true },
        { id: 'subjects', label: '主要涉及学科', type: 'checkbox', req: false, opts: [
          ['cn', '语文'], ['math', '数学'], ['en', '英语'],
          ['sci', '理化生'], ['hum', '政史地'],
          ['art', '体音美 / 信息科技'], ['all', '全学科']
        ]},
        { id: 'aiLevel', label: '参训教师对 AI 工具的熟悉程度', type: 'radio', req: true,
          hint: '0 基础和大班额同时出现时，实操必须换形式。',
          opts: [
            ['zero', '基本没用过任何 AI 工具'],
            ['chat', '用过聊天类 AI（豆包 / DeepSeek / Kimi 等），但没用过课堂分析'],
            ['analytics', '用过课堂分析类工具'],
            ['helper', '有几位老师已比较熟练，可以当现场助手']
          ]},
        { id: 'voluntary', label: '参训是怎么来的', type: 'radio', req: true,
          hint: '非自愿参训，开场 10 分钟必须用来处理动机，否则后面讲什么都没用。',
          opts: [
            ['free', '自愿报名'],
            ['arranged', '教研组或学校统一安排'],
            ['mandatory', '全员要求，必须参加'],
            ['unknown', '不清楚']
          ]},
        { id: 'seeds', label: '有没有 1–3 位愿意带头试的老师', type: 'radio', req: false, opts: [
          ['yes', '有明确人选'], ['maybe', '可能有，还没定'],
          ['no', '没有'], ['unknown', '不清楚']
        ], hint: '没有种子教师，培训结束就是终点。这一项我们会当成硬指标来设计。' }
      ]
    },

    /* ---------------- G 现场 ---------------- */
    {
      id: 'G',
      title: '现场条件',
      desc: '这一段决定"能不能动手"。很多培训失败，不是内容问题，是插座问题。',
      fields: [
        { id: 'venue', label: '场地', type: 'radio', req: true, opts: [
          ['hall', '报告厅 / 阶梯教室'], ['classroom', '普通教室'],
          ['lab', '机房'], ['smart', '智慧教室'],
          ['online', '线上直播'], ['unknown', '还没定']
        ]},
        { id: 'seating', label: '座位形式', type: 'radio', req: false, opts: [
          ['theater', '剧院式固定桌椅'], ['island', '岛式小组桌'],
          ['desk', '课桌式，可移动'], ['unknown', '不确定']
        ], hint: '固定座椅意味着做不了小组共创，方案要改。' },
        { id: 'duration', label: '可用时长', type: 'number', req: true, unit: '分钟',
          hint: '标准场次为 90–120 分钟。若只有一节课（40 分钟），方案要另做取舍。', ph: '例：90 或 120' },
        { id: 'devices', label: '教师现场用什么设备', type: 'radio', req: false, opts: [
          ['laptop', '自带笔记本'], ['pad', '自带平板'],
          ['phone', '只有手机'], ['none', '不带设备'], ['unknown', '不确定']
        ]},
        { id: 'wifi', label: '现场网络', type: 'radio', req: false, opts: [
          ['good', '稳定，可多人同时使用'], ['ok', '能连，但不稳定'],
          ['unknown', '不确定'], ['no', '没有可用网络']
        ]},
        { id: 'account', label: '真实账号情况', type: 'radio', req: false, opts: [
          ['yes', '有可以正常登录的账号'],
          ['limited', '有账号，但不便在公开场合演示'],
          ['demo', '只有演示环境'],
          ['unknown', '不清楚']
        ]},
        { id: 'realCase', label: '能否提供一节真实课堂录像，或一节想改的课', type: 'radio', req: false,
          hint: '这一项是培训质量的分水岭。用本校的课做分析，老师才会认。',
          opts: [
            ['yes', '可以提供'], ['coordinate', '可以协调录制'],
            ['no', '暂时没有'], ['unknown', '不清楚']
          ]},
        { id: 'av', label: '现场已有设备', type: 'checkbox', req: false, opts: [
          ['projector', '投影 / 大屏'], ['mic', '扩音麦克'],
          ['remote', '翻页笔'], ['record', '录播可回放'], ['unknown', '不确定']
        ]}
      ]
    },

    /* ---------------- H 成果与后续 ---------------- */
    {
      id: 'H',
      title: '成果与后续',
      desc: '培训当天是起点，不是终点。这一段谈培训之后。',
      fields: [
        { id: 'deliver', label: '希望培训后带走什么', type: 'checkbox', req: false, opts: [
          ['slides', '培训课件'], ['manual', '操作手册'],
          ['onepager', '一页纸操作流程'], ['cases', '学科应用案例包'],
          ['follow', '培训后跟进计划'], ['plan', '校本推进方案'],
          ['none', '暂时不需要']
        ]},
        { id: 'next30', label: '培训后一个月内，学校打算做的第一件事', type: 'textarea', req: false,
          hint: '写不出来是正常信号——我们会把它列为培训现场的产出任务。',
          ph: '例：八年级数学组每人上传一节录像，组内做一次报告解读' },
        { id: 'media', label: '是否同意现场拍照 / 录像', type: 'radio', req: false,
          hint: '素材仅用于内部复盘与匿名化案例，发布前会再确认一次。',
          opts: [
            ['yes', '同意'], ['approval', '需报批'], ['no', '不同意']
          ]},
        { id: 'followOwner', label: '培训后的校内跟进人', type: 'text', req: false,
          hint: '只填姓名与职务即可，联系方式我们会通过学校统一渠道获取。',
          ph: '例：张××，教务处副主任' }
      ]
    }
  ]
};

/* ===========================================================
   第二份：ClassIn 团队填写
   记录商务与执行事实，以及对接人的判断——校方不知道、也不该被问的部分
   =========================================================== */
var INTAKE = {
  title: '培训需求问诊单',
  subtitle: 'ClassIn 团队填写',
  version: '2.0',
  desc: '这份由 ClassIn 侧对接人填写。它记录的是商务与执行事实，以及你的判断。客户不必看到。',
  fields: [
    { id: 'i_owner', label: '你的姓名 / 岗位', type: 'text', req: true },
    { id: 'i_schools', label: '客户学校与合同状态', type: 'schools', req: true,
      hint: '一所学校一行，名称写全称与校区（“××新学校项目”不是学校的名字），再逐项填这所学校的事实。同一个项目里往往几所学校状态不一致，这几栏决定培训能不能用真实数据演示、哪些话能说。',
      errMsg: '每所学校都要填校名、合同状态，以及培训与使用情况；确实不知道的请选「不确定 / 不清楚」',
      addText: '+ 再添加一所学校',
      opts: [
        ['signed', '已签合同'], ['quoting', '报价中'],
        ['internal', '已立项未签', '内部立项，尚未签约'], ['none', '还没谈']
      ],
      facts: [
        { key: 'trainedC', group: '到校培训过', label: '培训过 ClassIn', type: 'pick', req: true, opts: [
          ['yes', '有'], ['no', '没有'], ['unknown', '不确定']
        ]},
        { key: 'trainedA', group: '到校培训过', label: '培训过 AIC', type: 'pick', req: true, opts: [
          ['yes', '有'], ['no', '没有'], ['unknown', '不确定']
        ]},
        { key: 'useC', group: '已使用', label: 'ClassIn 用了', type: 'select', req: true, opts: [
          ['none', '还没开始'], ['m3', '3 个月以内'], ['m6', '3–6 个月'],
          ['m12', '6–12 个月'], ['y1', '1 年以上'], ['unknown', '不清楚']
        ]},
        { key: 'useA', group: '已使用', label: 'AIC 用了', type: 'select', req: true, opts: [
          ['none', '还没开始'], ['m3', '3 个月以内'], ['m6', '3–6 个月'],
          ['m12', '6–12 个月'], ['y1', '1 年以上'], ['unknown', '不清楚']
        ]}
      ]},
    { id: 'i_city', label: '培训城市与场地地址', type: 'text', req: false,
      hint: '写到门牌或校区楼栋。讲师需要据此安排行程，场地信息也影响设备与网络判断。多校联办时写实际办会的那一处。',
      ph: '例：济南市历下区××路××号，××学校（东校区）报告厅' },
    { id: 'i_date', label: '培训日期与时间', type: 'text', req: true,
      ph: '例：2026 年 10 月 30 日（周五）14:00–16:00' },
    { id: 'i_travel', label: '差旅安排', type: 'radio', req: true, opts: [
      ['we', '我方负责订票住宿'], ['them', '校方负责'],
      ['self', '讲师自理后报销'], ['unclear', '未定']
    ]},
    { id: 'i_ask', label: '客户最初提出的需求原文', type: 'textarea', req: true,
      hint: '请照抄客户原话，不要转述成你认为的意思，因为原文里藏着真实诉求。',
      ph: '例：分享学校/教研组/一线教师如何运用 AIC，目标是让老师对 AIC 感兴趣，促进教师使用' },
    { id: 'i_real', label: '你判断客户内部的真实期待', type: 'textarea', req: false,
      hint: '例如：借培训推动二期采购 / 应对上级检查 / 校长真的想推 / 只是维护关系。',
      ph: '这一题决定培训该往哪个方向使劲' },
    { id: 'i_others', label: '同场是否还有别的讲师或合作方', type: 'text', req: false,
      hint: '含厂商、高校专家、校方自己安排的人。', ph: '例：华东师大 AIC 团队 1 人，讲 30 分钟' },
    { id: 'i_risk', label: '你判断这次培训最大的风险是什么', type: 'textarea', req: false },
    { id: 'i_need', label: '需要讲师额外准备什么', type: 'textarea', req: false,
      hint: '如：领导座谈、签约仪式、媒体拍摄、单独给管理层开小灶。' }
  ]
};

/* ===========================================================
   主办方版 —— 对外，海报扫码进来填
   =========================================================== */
var HOST = {
  title: '培训需求问诊单',
  subtitle: '主办方填写',
  version: '1.0',
  desc: '这份由邀请方填写，用于判断这场培训讲什么、讲到哪一层。约 4 分钟。',
  fields: [
    { id: 'h_org', label: '邀请单位全称', type: 'text', req: true,
      ph: '例：××教育集团 / ××实验学校' },
    { id: 'h_name', label: '联系人姓名与职务', type: 'text', req: true,
      ph: '例：王××，教师发展中心主任' },
    { id: 'h_contact', label: '联系方式', type: 'text', req: true,
      hint: '手机号或微信号，用于确认时间与材料。',
      ph: '例：13×××××××××' },
    { id: 'h_type', label: '邀请方属于', type: 'radio', req: true, opts: [
      ['school', '学校'], ['group', '教育集团 / 教育局'],
      ['edtech', '教育科技公司'], ['other', '其他机构']
    ]},
    { id: 'h_date', label: '拟定的时间', type: 'text', req: false,
      hint: '不确定可以写「待定」，不影响后续沟通。',
      ph: '例：2026 年 11 月中旬' },
    { id: 'h_city', label: '培训地点', type: 'text', req: false,
      ph: '例：济南市历下区××路××号' },
    { id: 'h_len', label: '单场时长', type: 'radio', req: true, opts: [
      ['m90', '90 分钟'], ['m120', '120 分钟'], ['undecided', '待定']
    ], hint: '标准场次为 90–120 分钟，含答疑，不按半天或整天计。' },
    { id: 'h_sess', label: '场次', type: 'radio', req: false, opts: [
      ['one', '一场'], ['two', '两场'], ['more', '三场及以上'], ['undecided', '待定']
    ], hint: '连续多场同一天进行也可以，每场之间留 10 分钟换场。' },
    { id: 'h_who', label: '参训的是哪些人', type: 'checkbox', req: true, opts: [
      ['teacher', '一线教师'], ['lead', '教研组长 / 备课组长'],
      ['mid', '中层管理'], ['head', '校长 / 书记'], ['other', '其他']
    ]},
    { id: 'h_size', label: '参训人数', type: 'radio', req: true, opts: [
      ['s50', '50 人以内'], ['s100', '50–100 人'],
      ['s200', '100–200 人'], ['s300', '200 人以上'], ['unknown', '待定']
    ]},
    { id: 'h_stage', label: '目前 AI 进课堂走到哪一步', type: 'radio', req: true, opts: [
      ['none', '还没有开始'], ['few', '个别老师在试'],
      ['part', '部分学科在用'], ['all', '已常态化使用'], ['unknown', '说不清']
    ]},
    { id: 'h_tool', label: '目前使用的平台或工具', type: 'text', req: false,
      hint: '有就写，没有写「无」。', ph: '例：ClassIn / 希沃 / 国家智慧教育平台' },
    { id: 'h_ask', label: '最想解决的一个问题', type: 'textarea', req: true,
      hint: '只写一个。写得越具体，内容越对得上。',
      ph: '例：老师手里有课堂分析报告，但不知道下一节课怎么改' },
    { id: 'h_device', label: '现场条件', type: 'checkbox', req: false, opts: [
      ['wifi', '有稳定无线'], ['laptop', '老师自带笔记本'],
      ['room', '有机房或平板'], ['unstable', '网络不稳'], ['unknown', '不确定']
    ]},
    { id: 'h_other', label: '同场是否还有别的安排', type: 'text', req: false,
      hint: '含其他讲师、领导讲话、签约或拍摄。', ph: '例：校长先讲 20 分钟' }
  ]
};

/* ===========================================================
   标准工作流 —— 从"收到需求"到"沉淀成果"
   =========================================================== */
var SOP = [
  { when: 'T-21 ~ T-14', key: true, title: '需求诊断：把模糊需求变成可设计的需求',
    body: '同步发出两份问诊单，不要靠微信聊天来回问。',
    list: [
      '学校版 → 发给校内对接人，转发即填，6–7 分钟',
      '团队版 → 由你自己填，先把商务与执行事实钉死',
      '指定唯一对接人。多线沟通是信息失真的第一来源',
      '预约一次 15 分钟电话，只确认两件事：培训要解决的那一个问题、谁能拍板'
    ]},
  { when: 'T-10', title: '方案初稿：一个目标，不是三个',
    body: '按诊断结果写一页纸方案，只回答六个问题。',
    list: [
      '主目标：培训结束时，老师能做出哪个动作（可观察、可验证）',
      '对象：多少人、什么基础、自愿还是被安排',
      '主线：只讲卡点所在的那一层，其余不讲',
      '形式：能不能动手；不能动手就改成演示 + 跟做 + 现场反馈',
      '成果物：当天带走什么',
      '后续：谁接、30 天内做什么'
    ]},
  { when: 'T-7', key: true, title: '三方确认：跟决策人确认目标',
    body: '只跟对接人确认是不够的。目标必须由能负责的人认一遍。',
    list: [
      '把"目标 / 形式 / 成果物"三项用三句话发给校领导，请他回一个字：行',
      '确认场地、投影、网络、账号、设备，逐项落字',
      '确认参训人员构成是否与预期一致——临时加入领导会改变现场气氛',
      '向学校要一节真实课例，这是当天最有说服力的材料'
    ]},
  { when: 'T-3', title: '材料定稿 + 预演',
    body: '所有演示环节，在真实网络下走一遍。',
    list: [
      '课件、一页纸操作卡、离线备用包',
      '演示账号实测；准备断网版录屏',
      '准备人数翻倍与减半两套节奏',
      '把培训后跟进模板先写好，当天只填名字'
    ]},
  { when: 'T-1', title: '现场踩点',
    body: '能到就到。不能到，就让人替你拍三张照片：座位、投影、讲台视角。',
    list: [
      '投屏实测、音量实测',
      '与 1–2 位种子教师见一面，摸真实情绪',
      '确认签到方式与人数'
    ]},
  { when: 'D-day', key: true, title: '执行：把培训做成有产出的会',
    body: '培训当天必须留下四样东西，否则视为没做完。',
    list: [
      '开场 10 分钟处理动机（非自愿参训时，此步不可省）',
      '现场指定种子教师名单，当众确认',
      '当场写下 30 天第一件事，具体到人、到时间',
      '收集现场疑问清单，作为下一次跟进的依据'
    ]},
  { when: 'T+1', title: '交付回执',
    body: '当天或次日发出，趁热。',
    list: [
      '课件 + 操作卡 + 现场问答汇总',
      '种子教师名单与 30 天行动计划（发给校长，抄送对接人）'
    ]},
  { when: 'T+7', title: '第一次跟进',
    body: '一个电话，不超过 15 分钟。只问三件事。',
    list: [
      '有几个人真的用了',
      '卡在哪一步',
      '下次要不要调整'
    ]},
  { when: 'T+30', key: true, title: '复盘沉淀',
    body: '这一步决定这场培训是一次性的，还是可复用的资产。',
    list: [
      '收一组前后对比数据（使用人次 / 覆盖学科 / 课例数）',
      '写一页复盘：目标达成度、失效环节、下次改什么',
      '把过程素材整理成可对外呈现的案例（须经校方书面同意）',
      '更新问诊单与方案模板，把这次的教训写进规则'
    ]}
];
