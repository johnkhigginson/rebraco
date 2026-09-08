using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Rebraco.CMS.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTourScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TourAvailabilities",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    SlotDurationMinutes = table.Column<int>(type: "int", nullable: false),
                    MaxToursPerSlot = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TourAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TourAvailabilities_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalSchema: "rebraco",
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tours",
                schema: "rebraco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PropertyId = table.Column<int>(type: "int", nullable: false),
                    UnitId = table.Column<int>(type: "int", nullable: true),
                    InquiryId = table.Column<int>(type: "int", nullable: true),
                    ProspectMemberKey = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(254)", maxLength: 254, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    ScheduledDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ManagerNotes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ConfirmedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ReminderSentAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tours", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tours_Inquiries_InquiryId",
                        column: x => x.InquiryId,
                        principalSchema: "rebraco",
                        principalTable: "Inquiries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tours_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalSchema: "rebraco",
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tours_Units_UnitId",
                        column: x => x.UnitId,
                        principalSchema: "rebraco",
                        principalTable: "Units",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourAvailabilities_PropertyId",
                schema: "rebraco",
                table: "TourAvailabilities",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_TourAvailabilities_PropertyId_DayOfWeek",
                schema: "rebraco",
                table: "TourAvailabilities",
                columns: new[] { "PropertyId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_Tours_InquiryId",
                schema: "rebraco",
                table: "Tours",
                column: "InquiryId",
                filter: "[InquiryId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_PropertyId",
                schema: "rebraco",
                table: "Tours",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_ScheduledDate",
                schema: "rebraco",
                table: "Tours",
                column: "ScheduledDate");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_Status",
                schema: "rebraco",
                table: "Tours",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_UnitId",
                schema: "rebraco",
                table: "Tours",
                column: "UnitId",
                filter: "[UnitId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TourAvailabilities",
                schema: "rebraco");

            migrationBuilder.DropTable(
                name: "Tours",
                schema: "rebraco");
        }
    }
}
