CREATE TABLE "alunos" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"nome" text NOT NULL,
	"cpf" text,
	"rg" text,
	"email" text,
	"telefone" text,
	"data_nascimento" text,
	"faixa" text,
	"graus" integer DEFAULT 0,
	"status" text DEFAULT 'ativo',
	"academias" text,
	"professor_responsavel" text,
	"foto_perfil" text,
	"raw_student" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anti_evasion_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"nivel_risco" text,
	"raw_alert" jsonb
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"acao" text,
	"detalhe" text,
	"raw_log" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "aulas_experimentais" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"telefone" text,
	"turma_id" text,
	"data" text,
	"status" text DEFAULT 'pendente',
	"observacoes" text,
	"raw_aula" jsonb
);
--> statement-breakpoint
CREATE TABLE "backup_records" (
	"id" text PRIMARY KEY NOT NULL,
	"raw_backup" jsonb
);
--> statement-breakpoint
CREATE TABLE "calendar_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"google_event_id" text,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"location" text,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_events_google_event_id_unique" UNIQUE("google_event_id")
);
--> statement-breakpoint
CREATE TABLE "campeonato_inscricoes" (
	"id" text PRIMARY KEY NOT NULL,
	"campeonato_id" text,
	"atleta_id" text,
	"atleta_nome" text,
	"cpf" text,
	"categoria" text,
	"status_pagamento" text,
	"raw_inscricao" jsonb
);
--> statement-breakpoint
CREATE TABLE "campeonatos" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"data" text,
	"local" text,
	"status" text,
	"banner_url" text,
	"raw_campeonato" jsonb
);
--> statement-breakpoint
CREATE TABLE "carteirinha_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"credential_id" text,
	"user_id" text,
	"user_nome" text,
	"data_hora" text,
	"metodo" text,
	"resultado" text,
	"raw_log" jsonb
);
--> statement-breakpoint
CREATE TABLE "carteirinhas" (
	"id" text PRIMARY KEY NOT NULL,
	"credential_id" text NOT NULL,
	"auth_code" text NOT NULL,
	"user_id" text NOT NULL,
	"user_nome" text NOT NULL,
	"user_tipo" text,
	"foto_perfil" text,
	"status" text DEFAULT 'ativo',
	"validade" text,
	"registro" text,
	"qr_token" text,
	"raw_carteirinha" jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "carteirinhas_credential_id_unique" UNIQUE("credential_id"),
	CONSTRAINT "carteirinhas_auth_code_unique" UNIQUE("auth_code")
);
--> statement-breakpoint
CREATE TABLE "certificados" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"user_nome" text,
	"curso" text,
	"data_emissao" text,
	"codigo_validacao" text,
	"status" text,
	"raw_certificado" jsonb
);
--> statement-breakpoint
CREATE TABLE "checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"aluno_id" text,
	"turma_id" text,
	"professor_id" text,
	"data_hora" text NOT NULL,
	"status" text NOT NULL,
	"tipo_checkin" text,
	"justificativa" text,
	"raw_checkin" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"google_contact_id" text,
	"full_name" text NOT NULL,
	"email" text,
	"phone_number" text,
	"relationship" text,
	"notes" text,
	"synced_at" timestamp DEFAULT now(),
	CONSTRAINT "contacts_google_contact_id_unique" UNIQUE("google_contact_id")
);
--> statement-breakpoint
CREATE TABLE "contrato_aceites" (
	"id" text PRIMARY KEY NOT NULL,
	"contrato_id" text,
	"user_id" text,
	"data_aceite" text,
	"raw_aceite" jsonb
);
--> statement-breakpoint
CREATE TABLE "contratos_oficiais" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text,
	"versao" text,
	"ativo" boolean DEFAULT true,
	"raw_contrato" jsonb
);
--> statement-breakpoint
CREATE TABLE "crm_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"aluno_id" text,
	"raw_interaction" jsonb
);
--> statement-breakpoint
CREATE TABLE "digital_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"doc_type" text,
	"raw_doc" jsonb
);
--> statement-breakpoint
CREATE TABLE "health_records" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"tipo" text,
	"raw_record" jsonb
);
--> statement-breakpoint
CREATE TABLE "justificativas_faltas" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"data_falta" text,
	"motivo" text,
	"status" text DEFAULT 'pendente',
	"foto_comprovante" text,
	"raw_justificativa" jsonb
);
--> statement-breakpoint
CREATE TABLE "live_streams" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text,
	"descricao" text,
	"stream_url" text,
	"status" text,
	"raw_live" jsonb
);
--> statement-breakpoint
CREATE TABLE "noticias" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text,
	"resumo" text,
	"conteudo" text,
	"imagem_url" text,
	"data" text,
	"raw_noticia" jsonb
);
--> statement-breakpoint
CREATE TABLE "notificacoes" (
	"id" text PRIMARY KEY NOT NULL,
	"texto" text,
	"data" text,
	"para" text,
	"de" text,
	"lida" boolean DEFAULT false,
	"raw_notificacao" jsonb
);
--> statement-breakpoint
CREATE TABLE "professores" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"nome" text NOT NULL,
	"email" text,
	"telefone" text,
	"faixa" text,
	"grau" integer DEFAULT 0,
	"bio" text,
	"foto_perfil" text,
	"raw_professor" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "provas_enviadas" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"user_nome" text,
	"modulo" text,
	"nota" text,
	"status" text,
	"raw_prova" jsonb
);
--> statement-breakpoint
CREATE TABLE "publicidades" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text,
	"imagem_url" text,
	"link_url" text,
	"posicao" text DEFAULT 'topo',
	"ordem" integer DEFAULT 0,
	"ativo" boolean DEFAULT true,
	"raw_publicidade" jsonb
);
--> statement-breakpoint
CREATE TABLE "student_achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"raw_achievement" jsonb
);
--> statement-breakpoint
CREATE TABLE "student_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"aluno_id" text,
	"raw_goal" jsonb
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teacher_ai_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"professor_id" text,
	"aluno_id" text,
	"raw_analysis" jsonb
);
--> statement-breakpoint
CREATE TABLE "timeline_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"tipo" text,
	"raw_event" jsonb
);
--> statement-breakpoint
CREATE TABLE "training_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"turma_id" text,
	"dia_semana" text,
	"horario_inicio" text,
	"horario_fim" text,
	"disciplina" text,
	"professor" text,
	"raw_schedule" jsonb
);
--> statement-breakpoint
CREATE TABLE "turmas" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"modulo" text,
	"horario" text,
	"dias" text,
	"professor" text,
	"status" text DEFAULT 'ativa',
	"raw_turma" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_digital_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"doc_type" text,
	"raw_doc" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"tipo" text DEFAULT 'aluno',
	"perfil_label" text,
	"foto_perfil" text,
	"status" text DEFAULT 'ativo',
	"raw_user" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"titulo" text,
	"descricao" text,
	"video_url" text,
	"thumb_url" text,
	"categoria" text,
	"raw_video" jsonb
);
--> statement-breakpoint
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;