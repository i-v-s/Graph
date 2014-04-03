	//! Класс сети
function Network() 
{
	var Device = // Прототип устройства
	{
		N:[],// Узлы устройства
		B:[], // Ветви устройства
		AddI:function()
		{
			// Здесь устройство должно ввести поправки задающих токов N[i].I = f(N[j].V);
		},
		AddY:function()
		{
			// Здесь устройство должно ввести поправки в матрицу проводимости(куда именно?)
		},
		Info:function()
		{
			return 
			{
				Nodes: [
				 	{V:0.0, T:1, N:1}, // Земля
				 	{V:5.0,	T:1, N:3}, // Шина питания 5В
				 	{N:'K'}, // N - номер пина компонента KiCad
				 	{} // Внутренний узел устройства
				],
				Branches: [ // Список ветвей устройства
				    {p:0, q: 1},
				    {p:1, q: 2}
				]
			};
		}
	};
	var Resistor =
	{
		N:[],// Узлы устройства
		B:[], // Ветви устройства
		AddI:function(){},
		AddY:function()
		{
			B[0].y += 1.0 / R;// Здесь устройство должно ввести поправки в матрицу проводимости(куда именно?)
			B[0](1.0 / R); // Или так
		},
		Info:function()
		{
			return 
			{
				Nodes: [{N:1}, {N:2}],
				Branches: [{p:0, q: 1}]
			};
		}		
	}
	var Devices = [];
	
	function Node()//!< Класс узла сети
	{
		return
		{
			y: 0.0, //!< Проводимость узла
			V: 0.0, //!< Напряжение в узле
			I: 0.0, //!< Задающий ток узла
			T: 0, // Тип: enum TYPE {DISABLED = 0, CONST_V = 1, USUAL = 2, MISSED = 3} Type;
			//int N; //!< Номер узла
			//void * AddBranch(CNode * AdjacentNode, CYList * &Destination);
			Y: null, //CYList * YList; //!< Связный список матрицы проводимости
				// cplx * pY; // Yii, на которую влияет данный узел
			BC: 0, //!< Число ветвей узла

			LU:null, // Mark
			pLU:null // YMark
			//struct CSorted // Данные узла, которые хранятся в порядке оптимального исключения
			//{
			//	CNode * Original; // niyp
			//} SData, *Sorted; // nobr
			//CNode * Next;
		};
	};

		//! Класс ветви сети
		/*class CBranch 
		{
		private:
			friend CNetwork;
			template <bool Add> inline void Apply(cplx * Yp, cplx * Yq, cplx * Ypq, cplx * Yqp);
			union {cplx * pYpq; int iYpq; CBranch * NextBranch;};
			union {cplx * pYqp; int iYqp;}; // Проводимости, на которые влияет данная ветвь
		//private:
		public:
			int n_anc, bd_anc;
			int ip, iq; //!< Индексы узлов
			cplx yp, yq, y; //!< Проводимости П-образной схемы замещения
			cplx kt; //!< Коэффициент трансформации - включён между проводимостями y и yq, означает Vq = kt * Vp
			enum STATE {
				CONN = 0,	//!< Ветвь включена
				P_DISC = 2, //!< Ветвь отключена в начале
				Q_DISC = 3, //!< Ветвь отключена в конце
				DISC = 1	//!< Ветвь отключена
			} State; // Состояние ветви
			int Island; //!< Номер острова
			int NP; //!< Номер параллельной ветви
		};*/
		//! Элемент матрицы проводимостей
		/*typedef struct _CYArray
		{
			cplx Yij;
			cplx Yji;
		} CYArray;*/

	//! Класс элемента матрицы проводимости в виде связного списка
	function YList() 
	{
		return
		{
			y:0.0;                    // y - проводимость
			N:null;//	CNode * Node;   // nqy - соответствующий узел
			nx:null;//CYList * Next;  // nky - следующая ветвь
			s:null;//cplx * * Sources; // Источники данной проводимости
			b:null;//cplx * * Branches; // Проводимости ветвей - источники данной проводимости
			//inline void AddSource(cplx * &Source);
			//inline void FillSources(int Value);
			//inline void AddBranch(cplx * &Source);
			//inline void FillBranches(cplx * Value);
		};
	};

		//! Элемент триангулированной матрицы
		/*typedef struct _CLU 
		{
			cplx L, U; // L = Yij, Yii для V; U = Yji, 0 для I
			CNode * Node;
			CYArray * Y;
		} CLU;*/


		// Данные класса
		//int NodeCount, BranchCount; // Исходные данные
		//int UsualNodeCount;
	var Nodes = [];
	var Branches = [];			//

	var YList = null, FreeY = null;//	CYList * YList, * FreeY;	// Матрица проводимости в виде связного списка
	var Y = null;				// Матрица проводимости в виде массива
		int YSize;					//

		//CNode * Base;

	var LU = [];	//!< Триангулированная матрица
	//var LUIndex;
	var pLU = []; 

	// Методы сети

	function PrepareYList()
	{
		Y = null;
		int Size = NodeCount + BranchCount * 2;
		YList = new Array(Size + 1);// (CYList *)malloc((Size + 1) * sizeof(CYList));
		var y = 1;//CYList * y = YList;
		FreeY = 0;
		//(y++)->Next = 0;
		CNode * n = Nodes;
		for(var d in Devices)
		{
			
			
		}
		for(int c = NodeCount; c--; n++) if(n.Type >= 2)//CNode::USUAL || n->Type == CNode::MISSED) // Заполняем Y из узлов
		{
			n->Type = CNode::USUAL;
			y->Node = n;
			y->y = -n->y - n->y1 - n->yn;
			if(CSXN * SXN = n->SXN)
				SXN->ApplyToY(y->y, n);
			n->YList = y;
			n->BranchCount = 0;
			n->Mark = 0;
			y++;
		}
		else
			n->YList = 0;
		UsualNodeCount = (int)(y - YList) - 1;

		for(std::map<int, cplx>::iterator i = Shunts.begin(); i != Shunts.end(); i++) // Из шунтов
			if(CYList * yl = Nodes[i->first].YList)
				yl->y -= i->second;

		if(BranchCount)	for(CBranch * b = Branches + BranchCount - 1; b >= Branches; b--)  // Заполняем Y из ветвей
		{
			b->pYpq = 0;
			b->pYqp = 0;
			_ASSERTE(b->ip >= 0 && b->ip < NodeCount);
			_ASSERTE(b->iq >= 0 && b->iq < NodeCount);
			CNode * p = Nodes + b->ip;
			CNode * q = Nodes + b->iq;
			cplx * pYpq = 0, * pYqp = 0;
			if((p->Type == CNode::DISABLED) || (q->Type == CNode::DISABLED)) b->State = CBranch::DISC;
			if(b->State == CBranch::CONN)
			{
				if(p->Type == CNode::USUAL)
				{
					CYList * l = (CYList *)p->AddBranch(q, y);
					l->AddBranch(b->pYpq);
					pYpq = &l->y;
				}
				if(q->Type == CNode::USUAL)
				{
					CYList * l = (CYList *)q->AddBranch(p, y);
					l->AddBranch(b->pYqp);
					pYqp = &l->y;
				}
			}
			/*else
			{
				b->p b->pYpq = b->pYqp = 0;
				if(b->State == CBranch::P_DISC) b->
			}*/
			b->Apply<true>(&p->YList->y, &q->YList->y, pYpq, pYqp);
		}
		CYList * ylast = y - 1;
		YSize = (int)(ylast - YList);
		if(Size > YSize) 
		{
			for(int x = Size - YSize - 1; x; x--) 
				y = y->Next = y + 1;
			y->Next = 0;
		}
		if(UseFastTriangulation)
		{
			Y = (CYArray *) malloc(YSize * sizeof(CYArray));
			memset(Y, 0, YSize * sizeof(CYArray));
			YisValid = false;
			/*for(CYArray * y = Y + YSize - 1; y >= Y; y--, ylast--) 
				ylast-> = y;*/
		}

		
	}

	
	function ExcludeNode(Node)
	{
		var MinBranchCount = Node.BC;
		var maxd = MinimalDiagonalNorm;
	/*#if _DEBUG
		int deb_bc = MinBranchCount;
	#endif*/
		var Result = null;
		// Выделяем часть триангулированной матрицы, относящуюся к исключаемому узлу
		var lu = Array(MinBranchCount + 1);//LU.Alloc(MinBranchCount + 1);
		var plu = Array(MinBranchCount * MinBranchCount);//cplx * * plu  = pLU.Alloc(MinBranchCount * MinBranchCount);
		var Yii = Node.Y; // YList
		var Diag = 1.0 / Yii.y;
		// Отключаем узел от смежных
		var Prev = Yii;
		for(var j = Yii.Next; j; j = j.Next, lu++, LUIndex++)
		{
			//_ASSERTE(deb_bc--);
			var jNode = j.Node;
			jNode.BC--;
			lu->L = Diag * j.y;
			j.FillSources(LUIndex);
			if(j.Branches)
			{
				lu->Y = &Y[j - YList - 1];
				j->FillBranches(&lu->Y->Yij);
			}
			else
				lu->Y = 0;
			}
			lu->Node = jNode;
			if(jNode.Type != 2)// CNode::USUAL) 
			{
				lu->U = 0.0;
				continue;
			}
	/*#ifdef _DEBUG
			int f = 1;
			int deb_bc1 = Node->BranchCount;
	#endif*/
			for(var k = jNode.Y; k; k = k.Next) // Идём вокруг j
			{
				var kNode = k.Node;
				if(kNode === Node) 
				{
					//_ASSERTE(f--);// Надо проверять - найден ли этот узел.
					lu->U = Diag * k.y;
					k->FillSources(LUIndex | 0x80000000);//&lu->U);
					if(k->Branches)
					{
						k->FillBranches(&Y[j - YList - 1].Yji);
						//_ASSERTE(j - YList - 1 < YSize);
					}
					k = Prev;
					DeleteNextElement(Prev, FreeY);
				}
				else
				{ // Отмечаем в узле k узел j и связь, приведшую от него в k.
					kNode.LU/*Mark*/ = jNode;
					kNode.pLU/*YMark*/ = k;
					Prev = k;
				}
			}
			//_ASSERTE(!f);
			for(var k = Yii.Next; k; k = k.Next) // Идём вокруг i
			{
				var kNode = k.Node;
				var Yjk;
				if(kNode.LU/*->Mark*/ !== jNode) // Связи Yjk не было, создаём
				{
					Yjk = NewElement(YList, FreeY);
					Prev = Prev.Next = Yjk;
					Prev.Node = kNode;
					Prev.y = -(k.y * lu->U);
					Prev->Sources = 0;
					Prev->Branches = 0;
					jNode.BC++;
				}
				else
				{ 
					Yjk = kNode->YMark;
					Yjk->y -= k->y * lu->U;
				}
				_ASSERTE(deb_bc1--);
				if(UseFastTriangulation) Yjk->AddSource(*(plu++)); // Добавляем plu в список влияющих на Yjk
			}
			_ASSERTE(!deb_bc1);
			Prev->Next = 0; // Завершаем список ветвей j
			Prev = j;
			// Определяем - не стал ли узел оптимальным для следующего исключения
			int bc = jNode->BranchCount;
			if(MinBranchCount >= bc)
			{
				double d = norm(jNode->YList->y);
				if(d > ((MinBranchCount > bc) ? MinimalDiagonalNorm : maxd))
				{
					maxd = d;
					Result = jNode;
					MinBranchCount = bc;
				}
			}
		}
		_ASSERTE(!deb_bc);
		if(UseFastTriangulation)
			pLU.Last->Last = plu - 1;
		lu->Node = 0;
		lu->Y = Y + (Yii - YList - 1);
		lu->L = Diag;
		Node->pY = &lu->Y->Yij;
		Yii->FillSources(LUIndex++);//&lu->L);
		// Освобождаем элементы Yij для экономии памяти
		Prev.Next = FreeY;
		FreeY = Yii;
		return Result;

	};
	
	
		bool TriangulateYList(void);
		void IdxToPointers(void);
		void PrepareY(void);
		void ResetLU(CLU * First = 0);
		bool TriangulateLU(void);
		//template<bool Fast, bool Y> void PrepareSteadyState(void); //!< Метод подготовки задающих токов и шунтов из СХН и генераторов
		bool NeedPrepare;
		bool NeedTest;
		bool YisValid;
		int IslandCount;
		bool Prepare(void); //!< Метод триангуляции.
		void SaveMatrixY(const char * FileName);
	public:
		CDevice * m_DynaNet;
		bool UseFastTriangulation; //!< Разрешает быструю триангуляцию
		bool UseBestDiagonal; //!< Разрешает поиск узла с максимальной диагональю и минимальным числом ветвей.
			   //Иначе поиск ведётся до первого узла с минимальным числом ветвей и удовлетворительной диагональю.
		double MinimalDiagonalNorm; //!< Минимально допустимая норма диагонали
		bool UseSSE2; //!< Разрешает использование SSE2
		//bool YChanged;
		enum STATE {} State; //Состояние сети
		// Методы управления контентом
		void UpdateNodeMap(void);
		inline CSXN * GetSXN(int Number, bool Create = false) 
		{
			std::map<int, CSXN *>::iterator i = SXNMap.find(Number);
			if(i != SXNMap.end()) return i->second;
			CSXN * SXN = 0;
			if(Create)
			{
				SXN = new CSXN();
				SXNMap.insert(std::make_pair(Number, SXN));
			}
			return SXN;
		};
		void SetMinSXNV(const double &V) { if(V) for(std::map<int, CSXN *>::iterator i = SXNMap.begin(); i != SXNMap.end(); i++) i->second->SetMinVoltage(V);};
		double GetMaxSXNBreak(int * N) //!< Возвращает максимальный разрыв между кусками СХН
		{
			double r = 0;
			int n = 0;
			for(std::map<int, CSXN *>::iterator i = SXNMap.begin(); i != SXNMap.end(); i++)
			{
				double b = i->second->GetMaxBreak();
				if(b > r)
				{
					r = b;
					n = i->first;
				}
			}
			if(N) *N = n;
			return r;
		};

		//void CreateStandardSXN(void);
		inline CBranch &Branch(int Index) { _ASSERTE((Index >= 0) && (Index < BranchCount)); return Branches[Index];};
		inline CNode &Node(int Index) { _ASSERT((Index >= 0) && (Index < NodeCount)); return Nodes[Index];};
		inline CBranch * GetBranches(void) { return Branches;};
		inline CNode * GetNodes(void) { return Nodes;};
		double GetMaxSXNDisc(void); //!< Возвращает невязку тока СХН
		// Уведомления
		void SetSize(int NodeCount, int BranchCount);
		void SetBranchState(int Branch, CBranch::STATE State);
		void SetBranchParams(int Branch, const cplx * y, const cplx * yp = 0, const cplx * yq = 0, const cplx * kt = 0);
		void SetNodeType(int Node, CNode::TYPE Type);
		void SetNodeParams(int Node, const cplx * y, const cplx * y1 = 0);//!< Устанавивает шунты в узле. y - шунт нагрузки (сети), y1 - шунт генератора.
		void SetShunt(int Node, const cplx &Y); //!< Устанавивает дополнительный шунт в узле. Используется для установки КЗ.
		void SetNodeSn(int Node, const cplx &Sn); //!< Устанавливает номинальную мощность нагрузки в узле
		void RemoveShunt(int Node);
		const cplx& GetShunt(int Node); //!< Возвращает дополнительный шунт в узле.
		inline cplx GetTotalShunt(int Node) // Возвращает полный шунт узла (не считая шунта генератора)
		{
			_ASSERTE((Node >= 0) && (Node < NodeCount));
			CNode & n = Nodes[Node];
			return n.y /*+ n.y1*/ + GetShunt(Node);					
		};
		inline cplx GetNodeY(int Node) // Возвращает изначальную проводимость узла (из Metakit)
		{
			_ASSERTE((Node >= 0) && (Node < NodeCount));
			CNode & n = Nodes[Node];
			return n.yo;
		};
		inline cplx GetNodeSnr(int Node)
		{
			_ASSERTE((Node >= 0) && (Node < NodeCount));
			CNode & n = Nodes[Node];
			cplx Sn = norm(n.V) * conj(n.yn + n.y - n.yo);
			if(n.SXN)
			{
				cplx Ssxn;
				n.SXN->GetSnr(Ssxn, &n);
				Sn += Ssxn;
			}
			return Sn;
		}
		inline cplx GetNodeSnnom(int Node)
		{
			_ASSERTE((Node >= 0) && (Node < NodeCount));
			CNode & n = Nodes[Node];
			cplx Sn = (n.Vnom * n.Vnom) * conj(n.yn + n.y - n.yo);
			if(n.SXN) Sn += n.Sn;
			return Sn;
		}
		int SetShortCircuit(int Branch, const cplx * Shunt, double Position = 0.5); // Позиция от 0 до 1.
		void inline DiscardY(bool Reorder = false) 
		{
			YisValid = false; 
			NeedPrepare = true; 
			if(Reorder) { LU.Reset(); pLU.Reset();}
		};
		// Справочные методы
		inline int GetNodeCount(void) const {return NodeCount;};
		inline int GetBranchCount(void) const {return BranchCount;};
		void GetBranchCurrent(int Branch, bool End, cplx &Current);//!< Ток, _в_текающий в линию.
		void GetBranchPower(int Branch, bool End, cplx &Power);//!< Мощность, _в_текающая в линию.
		void GetBranchResistance(int Branch, bool End, cplx &Resistance);//!< Мощность, _в_текающая в линию.
		inline CNode * GetNodeByNumber(int Number) 
		{
			if(NodeMap.empty()) UpdateNodeMap();
			std::map<int, CNode *>::iterator i = NodeMap.find(Number);
			return (i == NodeMap.end()) ? 0 : i->second;
		};
		inline int GetNodeIndexByNumber(int Number) 
		{
			if(NodeMap.empty()) UpdateNodeMap();
			std::map<int, CNode *>::iterator i = NodeMap.find(Number);
			return (i == NodeMap.end()) ? -1 : i->second - Nodes;
		};
		inline const CPFlat<CLU> &GetLU(void) const {return LU;};	//!< Триангулированная матрица
		inline const CPFlat<cplx *> &GetpLU(void) const {return pLU;};
		inline bool GetNeedPrepare() const { return NeedPrepare ; }
		// Методы расчёта
		bool Solve(void);
		void CalcPolarV();
		//void SolveSteadyState(void);
		// Прочее
		int GetIslands(void);
		void Clean(); //!< Метод освобождения памяти
		double Test(void);
		bool ExportToR_pd(R_pdn * pd);
		bool ImportFromR_pd(R_pdn * pd);
		CNetwork(void);
		~CNetwork(void);
	};
